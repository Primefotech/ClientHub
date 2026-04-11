import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, LeadSource, Role } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

export interface CreateLeadDto {
  projectId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  webhookId?: string;
  notes?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  value?: number;
  currency?: string;
  assignedToId?: string;
}

export interface UpdateLeadDto {
  status?: LeadStatus;
  notes?: string;
  assignedToId?: string;
  customFields?: Record<string, any>;
  lostReason?: string;
  value?: number;
}

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(
    projectId: string,
    userId: string,
    userRole: Role,
    query: { status?: LeadStatus; assignedToId?: string; search?: string; page?: number; limit?: number },
  ) {
    const { status, assignedToId, search, page = 1, limit = 20 } = query;
    const where: any = { projectId };

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    // Client staff can only see leads assigned to them
    if (userRole === Role.CLIENT_STAFF) {
      where.assignedToId = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.cRMLead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { history: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cRMLead.count({ where }),
    ]);

    return { leads, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const lead = await this.prisma.cRMLead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(dto: CreateLeadDto, createdById: string, userRole: Role) {
    // Only PH or authorized staff can add leads manually
    if (userRole === Role.CLIENT_STAFF || userRole === Role.CLIENT_OWNER) {
      throw new ForbiddenException('You do not have permission to add leads');
    }

    const lead = await this.prisma.cRMLead.create({
      data: { ...dto, createdById },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await this.activityLogs.log({
      projectId: dto.projectId,
      userId: createdById,
      action: 'LEAD_CREATED',
      entity: 'crm_lead',
      entityId: lead.id,
      details: { name: dto.name, source: dto.source },
    });

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, userId: string, userRole: Role) {
    const lead = await this.findOne(id);

    // Client staff can only update status and notes
    if (userRole === Role.CLIENT_STAFF) {
      const allowedFields = ['status', 'notes'];
      const attemptedFields = Object.keys(dto);
      const forbidden = attemptedFields.filter((f) => !allowedFields.includes(f));
      if (forbidden.length) {
        throw new ForbiddenException(`Client staff cannot update: ${forbidden.join(', ')}`);
      }
    }

    const updated = await this.prisma.cRMLead.update({ where: { id }, data: dto });

    // Track history
    for (const [field, newValue] of Object.entries(dto)) {
      const oldValue = (lead as any)[field];
      if (oldValue !== newValue) {
        await this.prisma.cRMLeadHistory.create({
          data: {
            leadId: id,
            changedById: userId,
            field,
            oldValue: String(oldValue ?? ''),
            newValue: String(newValue ?? ''),
          },
        });
      }
    }

    await this.activityLogs.log({
      projectId: lead.projectId,
      userId,
      action: 'LEAD_UPDATED',
      entity: 'crm_lead',
      entityId: id,
      details: dto,
    });

    return updated;
  }

  async getStats(projectId: string) {
    const [byStatus, total, bySource] = await Promise.all([
      this.prisma.cRMLead.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.cRMLead.count({ where: { projectId } }),
      this.prisma.cRMLead.groupBy({
        by: ['source'],
        where: { projectId },
        _count: true,
      }),
    ]);

    const totalValue = await this.prisma.cRMLead.aggregate({
      where: { projectId, status: LeadStatus.WON },
      _sum: { value: true },
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
      totalWonValue: totalValue._sum.value || 0,
    };
  }

  async webhookCreateLead(projectId: string, webhookId: string, data: Record<string, any>, mapping: Record<string, string>) {
    // Map webhook fields to lead fields
    const leadData: Partial<CreateLeadDto> = {
      projectId,
      webhookId,
      source: LeadSource.WEBHOOK,
    };

    for (const [leadField, webhookField] of Object.entries(mapping)) {
      if (data[webhookField] !== undefined) {
        (leadData as any)[leadField] = data[webhookField];
      }
    }

    if (!leadData.name) leadData.name = data.full_name || data.name || data.email || 'Unknown Lead';

    return this.prisma.cRMLead.create({
      data: { ...(leadData as any), createdById: 'SYSTEM' },
    });
  }
}
