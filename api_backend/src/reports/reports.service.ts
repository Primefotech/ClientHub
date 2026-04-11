import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

export interface CreateAdReportDto {
  projectId: string;
  platform: string;
  campaignName?: string;
  campaignId?: string;
  dateFrom: string;
  dateTo: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  conversions?: number;
  revenue?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(projectId: string, query: { platform?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const { platform, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const where: any = { projectId };
    if (platform) where.platform = platform;
    if (dateFrom || dateTo) {
      where.dateFrom = {};
      if (dateFrom) where.dateFrom.gte = new Date(dateFrom);
      if (dateTo) where.dateFrom.lte = new Date(dateTo);
    }

    const [reports, total] = await Promise.all([
      this.prisma.adReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dateFrom: 'desc' },
      }),
      this.prisma.adReport.count({ where }),
    ]);

    return { reports, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAggregated(projectId: string, query: { dateFrom?: string; dateTo?: string; groupBy?: string }) {
    const { dateFrom, dateTo } = query;
    const where: any = { projectId };
    if (dateFrom) where.dateFrom = { gte: new Date(dateFrom) };
    if (dateTo) where.dateTo = { lte: new Date(dateTo) };

    const [aggregate, byPlatform] = await Promise.all([
      this.prisma.adReport.aggregate({
        where,
        _sum: { spend: true, impressions: true, clicks: true, leads: true, conversions: true, revenue: true },
        _avg: { cpl: true, cpc: true, ctr: true, roas: true },
      }),
      this.prisma.adReport.groupBy({
        by: ['platform'],
        where,
        _sum: { spend: true, leads: true, conversions: true, revenue: true },
        _count: true,
      }),
    ]);

    const totalLeads = aggregate._sum.leads || 0;
    const totalSpend = aggregate._sum.spend || 0;

    return {
      totals: {
        spend: totalSpend,
        impressions: aggregate._sum.impressions || 0,
        clicks: aggregate._sum.clicks || 0,
        leads: totalLeads,
        conversions: aggregate._sum.conversions || 0,
        revenue: aggregate._sum.revenue || 0,
        cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
        ctr: aggregate._avg.ctr || 0,
        roas: aggregate._avg.roas || 0,
      },
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        spend: p._sum.spend || 0,
        leads: p._sum.leads || 0,
        conversions: p._sum.conversions || 0,
        revenue: p._sum.revenue || 0,
        count: p._count,
      })),
    };
  }

  async create(dto: CreateAdReportDto, userId: string) {
    const report = await this.prisma.adReport.create({
      data: {
        ...dto,
        dateFrom: new Date(dto.dateFrom),
        dateTo: new Date(dto.dateTo),
        cpl: dto.spend && dto.leads && dto.leads > 0 ? dto.spend / dto.leads : undefined,
        cpc: dto.spend && dto.clicks && dto.clicks > 0 ? dto.spend / dto.clicks : undefined,
        ctr: dto.clicks && dto.impressions && dto.impressions > 0 ? (dto.clicks / dto.impressions) * 100 : undefined,
        roas: dto.revenue && dto.spend && dto.spend > 0 ? dto.revenue / dto.spend : undefined,
      },
    });

    await this.activityLogs.log({
      projectId: dto.projectId,
      userId,
      action: 'REPORT_CREATED',
      entity: 'ad_report',
      entityId: report.id,
      details: { platform: dto.platform, campaignName: dto.campaignName },
    });

    return report;
  }

  async update(id: string, dto: Partial<CreateAdReportDto>) {
    return this.prisma.adReport.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.adReport.delete({ where: { id } });
  }

  async getTimeSeries(projectId: string, dateFrom: string, dateTo: string) {
    return this.prisma.adReport.findMany({
      where: {
        projectId,
        dateFrom: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      orderBy: { dateFrom: 'asc' },
      select: {
        id: true, platform: true, dateFrom: true, dateTo: true,
        spend: true, leads: true, clicks: true, impressions: true, conversions: true, revenue: true,
        cpl: true, ctr: true, roas: true,
      },
    });
  }

  async getGlobalStats() {
    const [
      tenantsCount,
      projectsCount,
      creativesCount,
      totalAdStats,
      tenantsBreakdown,
      projectsBreakdown
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.project.count(),
      this.prisma.creative.count(),
      this.prisma.adReport.aggregate({
        _sum: { spend: true, leads: true, revenue: true, conversions: true },
      }),
      this.prisma.tenant.findMany({
        take: 5,
        include: {
          _count: { select: { projects: true } },
          projects: {
            select: {
              adReports: {
                select: { spend: true, leads: true }
              }
            }
          }
        },
        orderBy: { projects: { _count: 'desc' } }
      }),
      this.prisma.project.findMany({
        take: 5,
        include: {
          tenant: { select: { name: true } },
          _count: { select: { creatives: true } }
        },
        orderBy: { creatives: { _count: 'desc' } }
      })
    ]);

    return {
      totals: {
        tenants: tenantsCount,
        projects: projectsCount,
        creatives: creativesCount,
        spend: totalAdStats._sum.spend || 0,
        leads: totalAdStats._sum.leads || 0,
        revenue: totalAdStats._sum.revenue || 0,
        conversions: totalAdStats._sum.conversions || 0,
      },
      tenants: tenantsBreakdown.map(t => ({
        id: t.id,
        name: t.name,
        projectsCount: t._count.projects,
        totalSpend: t.projects.reduce((acc, p) => acc + p.adReports.reduce((sAcc, r) => sAcc + (r.spend || 0), 0), 0),
        totalLeads: t.projects.reduce((acc, p) => acc + p.adReports.reduce((sAcc, r) => sAcc + (r.leads || 0), 0), 0),
      })),
      projects: projectsBreakdown.map(p => ({
        id: p.id,
        name: p.name,
        tenantName: p.tenant.name,
        creativesCount: p._count.creatives,
      }))
    };
  }

  async getStaffPerformance() {
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: ['PROJECT_HEAD', 'BRANDBOOK_STAFF'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: { uploadedCreatives: true },
        },
        uploadedCreatives: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            approvalRequests: {
              select: {
                id: true,
                status: true,
                approvalLogs: {
                  select: { action: true },
                },
              },
            },
          },
        },
      },
    });

    return staff.map((s) => {
      let totalRevisions = 0;
      let approvedCount = 0;

      s.uploadedCreatives.forEach((c) => {
        if (c.status === 'APPROVED') approvedCount++;
        c.approvalRequests.forEach((r) => {
          totalRevisions += r.approvalLogs.filter((l) => l.action === 'REVISION_REQUESTED').length;
        });
      });

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        creativesCount: s._count.uploadedCreatives,
        approvedCount,
        revisionRate: s._count.uploadedCreatives > 0 ? (totalRevisions / s._count.uploadedCreatives).toFixed(2) : 0,
        totalRevisions,
      };
    });
  }
}
