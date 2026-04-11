import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface CreateProjectDto {
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Record<string, any>;
  brandAssetsUrl?: string;
  isHandoverComplete?: boolean;
  projectManagerId?: string;
  milestones?: any;
  serviceId?: string;
  figmaLink?: string;
  stagingLink?: string;
  proposalUrl?: string;
  hasSLA?: boolean;
  slaType?: string;
  slaDocumentUrl?: string;
  supportSystemActive?: boolean;
  maxRevisions?: number;
  handoverCredentials?: string;
  trainingScheduledAt?: Date;
  handoverDocuments?: string[];
  handoverLinks?: string[];
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: Role, query: { tenantId?: string; search?: string; includeArchived?: string | boolean }) {
    const { tenantId, search, includeArchived } = query;
    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // Non-super admins can only see their assigned projects
    if (userRole !== Role.SUPER_ADMIN) {
      where.projectUsers = { some: { userId } };
    }

    // Default to only showing non-archived projects
    if (includeArchived === 'true' || includeArchived === true) {
      // Show everything
    } else {
      where.isArchived = false;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true, logo: true } },
        projectUsers: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
        },
        service: true,
        _count: {
          select: { creatives: true, crmLeads: true, calendarEvents: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tenant: true,
        projectUsers: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
        },
        projectManager: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        approvalRules: true,
        ruleConfigs: true,
        service: true,
        meetingRequests: { take: 5, orderBy: { createdAt: 'desc' } },
        supportTickets: { where: { status: 'OPEN' } },
        revisionRequests: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            creatives: true, crmLeads: true, calendarEvents: true,
            threads: true, adReports: true, upsells: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (userRole !== Role.SUPER_ADMIN) {
      const membership = project.projectUsers.find((pu) => pu.userId === userId);
      if (!membership) throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        milestones: dto.milestones || [
          { id: '1', label: 'Proposal Sent', status: 'completed' },
          { id: '2', label: 'Payment Received', status: 'pending' },
          { id: '3', label: 'Project Kickoff', status: 'pending' },
          { id: '4', label: 'Design & Development', status: 'pending' },
          { id: '5', label: 'Review & Feedback', status: 'pending' },
          { id: '6', label: 'Project Delivery', status: 'pending' },
        ],
      },
      include: { tenant: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: Partial<CreateProjectDto> & { status?: string }) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async getDashboard(id: string) {
    const [
      pendingApprovals,
      totalCreatives,
      recentLeads,
      upcomingEvents,
      adStats,
      recentActivity,
      project,
      openTickets,
      pendingMeetings,
    ] = await Promise.all([
      this.prisma.approvalRequest.count({
        where: { creative: { projectId: id }, status: 'PENDING_APPROVAL' },
      }),
      this.prisma.creative.count({ where: { projectId: id } }),
      this.prisma.cRMLead.count({ where: { projectId: id } }),
      this.prisma.calendarEvent.count({
        where: { projectId: id, startDate: { gte: new Date() } },
      }),
      this.prisma.adReport.aggregate({
        where: { projectId: id },
        _sum: { spend: true, leads: true, conversions: true, revenue: true },
      }),
      this.prisma.activityLog.findMany({
        where: { projectId: id },
        take: 10,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.findUnique({
        where: { id },
        select: { revisionCount: true, milestones: true, isHandoverComplete: true },
      }),
      this.prisma.supportTicket.count({ where: { projectId: id, status: 'OPEN' } }),
      this.prisma.meetingRequest.count({ where: { projectId: id, status: 'PENDING' } }),
    ]);

    return {
      pendingApprovals,
      totalCreatives,
      recentLeads,
      upcomingEvents,
      totalSpend: adStats._sum.spend || 0,
      totalLeads: adStats._sum.leads || 0,
      totalConversions: adStats._sum.conversions || 0,
      totalRevenue: adStats._sum.revenue || 0,
      recentActivity,
      revisions: project?.revisionCount ?? 0,
      openTickets,
      pendingMeetings,
    };
  }

  async getUserRole(projectId: string, userId: string): Promise<Role | null> {
    const pu = await this.prisma.projectUser.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return pu?.role ?? null;
  }

  async archive(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { isArchived: false, archivedAt: null },
    });
  }
}
