import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTenantDto {
  name: string;
  slug: string;
  logo?: string;
  domain?: string;
  industry?: string;
  settings?: Record<string, any>;
}

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; page?: any; limit?: any }) {
    const search = query.search;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { tenantUsers: true, projects: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { tenants, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantUsers: { include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } } },
        projects: {
          include: { _count: { select: { projectUsers: true, creatives: true } } },
        },
        _count: { select: { tenantUsers: true, projects: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already in use');

    return this.prisma.tenant.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateTenantDto> & { isActive?: boolean }) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getStats(tenantId: string) {
    const [projects, leads, creatives, adReports] = await Promise.all([
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.cRMLead.count({ where: { project: { tenantId } } }),
      this.prisma.creative.count({ where: { project: { tenantId } } }),
      this.prisma.adReport.aggregate({
        where: { project: { tenantId } },
        _sum: { spend: true, leads: true, conversions: true },
      }),
    ]);

    return {
      projects,
      leads,
      creatives,
      totalSpend: adReports._sum.spend || 0,
      totalLeads: adReports._sum.leads || 0,
      totalConversions: adReports._sum.conversions || 0,
    };
  }
}
