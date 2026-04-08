import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface CreateContentTypeDto {
  name: string;
  description?: string;
  isGlobal?: boolean;
  projectId?: string;
  fields?: any[];
  defaultApprovalRequired?: boolean;
  defaultAutoApprove?: boolean;
  autoApproveAfterHours?: number;
  icon?: string;
  color?: string;
}

@Injectable()
export class ContentTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { projectId?: string; isGlobal?: any; includeArchived?: string | boolean }) {
    const { projectId, isGlobal, includeArchived } = query;
    const where: any = {};

    if (isGlobal !== undefined) {
      where.isGlobal = isGlobal === 'true' || isGlobal === true;
    }
    
    // Default to only showing non-archived items unless specified
    if (includeArchived === 'true' || includeArchived === true) {
      // Show everything
    } else {
      where.isArchived = false;
    }

    if (projectId) {
      where.OR = [
        { projectId, isArchived: where.isArchived }, 
        { isGlobal: true, isArchived: where.isArchived }
      ];
    }

    return this.prisma.contentType.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { creatives: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ct = await this.prisma.contentType.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { creatives: true } },
      },
    });
    if (!ct) throw new NotFoundException('Content type not found');
    return ct;
  }

  async create(dto: CreateContentTypeDto, userId: string, userRole: Role) {
    // Only Super Admin can create global content types
    if (dto.isGlobal && userRole !== Role.SUPER_ADMIN) {
      dto.isGlobal = false;
    }

    return this.prisma.contentType.create({
      data: { ...dto, createdById: userId },
    });
  }

  async update(id: string, dto: Partial<CreateContentTypeDto>) {
    await this.findOne(id);
    return this.prisma.contentType.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.contentType.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  async restore(id: string) {
    await this.findOne(id);
    return this.prisma.contentType.update({
      where: { id },
      data: { isArchived: false, archivedAt: null },
    });
  }

  async delete(id: string) {
    return this.prisma.contentType.delete({ where: { id } });
  }
}
