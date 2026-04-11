import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  tenantId?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { role?: Role; roles?: string | string[]; tenantId?: string; search?: string; page?: number; limit?: number }) {
    const { role, roles, tenantId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    } else if (roles) {
      // Support multi-role filter: ?roles=SUPER_ADMIN&roles=PROJECT_HEAD or roles: [...]
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      if (rolesArray.length === 1) {
        where.role = rolesArray[0];
      } else if (rolesArray.length > 1) {
        where.role = { in: rolesArray };
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tenantId) {
      where.tenantUsers = { some: { tenantId } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true,
          phone: true, avatar: true, isActive: true, lastLoginAt: true, createdAt: true,
          tenantUsers: { include: { tenant: { select: { id: true, name: true } } } },
          projectUsers: { include: { project: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true,
        phone: true, avatar: true, isActive: true, lastLoginAt: true, createdAt: true,
        tenantUsers: { include: { tenant: true } },
        projectUsers: { include: { project: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const password = await bcrypt.hash(dto.password, 12);
    const { tenantId, ...rest } = dto;

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password,
        ...(tenantId && {
          tenantUsers: { create: { tenantId } },
        }),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true },
    });
  }

  async assignToProject(userId: string, projectId: string, role: Role, permissions: Record<string, any> = {}) {
    return this.prisma.projectUser.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role, permissions },
      update: { role, permissions },
    });
  }

  async removeFromProject(userId: string, projectId: string) {
    return this.prisma.projectUser.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async assignToTenant(userId: string, tenantId: string) {
    return this.prisma.tenantUser.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: { tenantId, userId },
      update: {},
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
