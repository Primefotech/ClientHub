import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, Role } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

export interface CreateCreativeDto {
  projectId: string;
  contentTypeId?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType: string;
  mimeType?: string;
  fileSize?: number;
  requiresApproval?: boolean;
  scheduledAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class CreativesService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(projectId: string, query: { status?: ContentStatus; fileType?: string; page?: number; limit?: number }) {
    const { status, fileType, page = 1, limit = 20 } = query;
    const where: any = { projectId };
    if (status) where.status = status;
    if (fileType) where.fileType = fileType;
    where.isLatestVersion = true;

    const [creatives, total] = await Promise.all([
      this.prisma.creative.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
          contentType: { select: { id: true, name: true, icon: true, color: true } },
          approvalRequests: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { approvalLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
          },
          _count: { select: { versions: true, threads: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.creative.count({ where }),
    ]);

    return { creatives, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const creative = await this.prisma.creative.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        contentType: true,
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            approvalLogs: {
              orderBy: { createdAt: 'desc' },
              include: { actionBy: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
        threads: {
          include: {
            comments: {
              include: { author: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        versions: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!creative) throw new NotFoundException('Creative not found');
    return creative;
  }

  async create(dto: CreateCreativeDto, uploadedById: string) {
    // Check approval rules for this project/content type
    const rule = await this.prisma.approvalRule.findFirst({
      where: {
        projectId: dto.projectId,
        OR: [{ contentTypeId: dto.contentTypeId }, { contentTypeId: null }],
      },
      orderBy: { priority: 'desc' },
    });

    const requiresApproval = dto.requiresApproval ?? rule?.requiresApproval ?? true;
    const status = requiresApproval ? ContentStatus.PENDING_APPROVAL : ContentStatus.APPROVED;

    const creative = await this.prisma.creative.create({
      data: {
        ...dto,
        uploadedById,
        status,
        requiresApproval,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        contentType: { select: { id: true, name: true } },
      },
    });

    // Auto-create approval request if needed
    if (requiresApproval) {
      const deadline = rule?.approvalDeadlineHours
        ? new Date(Date.now() + rule.approvalDeadlineHours * 3600 * 1000)
        : null;

      await this.prisma.approvalRequest.create({
        data: {
          creativeId: creative.id,
          requestedById: uploadedById,
          status: ContentStatus.PENDING_APPROVAL,
          deadline,
        },
      });
    }

    await this.activityLogs.log({
      projectId: dto.projectId,
      userId: uploadedById,
      action: 'CREATIVE_UPLOADED',
      entity: 'creative',
      entityId: creative.id,
      details: { title: dto.title, fileType: dto.fileType },
    });

    return creative;
  }

  async update(id: string, dto: Partial<CreateCreativeDto>, userId: string) {
    const creative = await this.findOne(id);

    // Create new version
    await this.prisma.creative.update({
      where: { id },
      data: { isLatestVersion: false },
    });

    const { projectId, ...rest } = dto;
    const newVersion = await this.prisma.creative.create({
      data: {
        ...(rest as any),
        projectId: creative.projectId,
        uploadedById: userId,
        versionNumber: creative.versionNumber + 1,
        parentId: creative.parentId || id,
        isLatestVersion: true,
        status: ContentStatus.PENDING_APPROVAL,
        requiresApproval: creative.requiresApproval,
      },
    });

    await this.activityLogs.log({
      projectId: creative.projectId,
      userId,
      action: 'CREATIVE_UPDATED',
      entity: 'creative',
      entityId: id,
      details: { newVersionId: newVersion.id, version: newVersion.versionNumber },
    });

    return newVersion;
  }

  async updateStatus(id: string, status: ContentStatus, userId: string) {
    const creative = await this.prisma.creative.update({
      where: { id },
      data: { status },
    });

    await this.activityLogs.log({
      projectId: creative.projectId,
      userId,
      action: 'CREATIVE_STATUS_CHANGED',
      entity: 'creative',
      entityId: id,
      details: { status },
    });

    return creative;
  }

  async delete(id: string) {
    return this.prisma.creative.delete({ where: { id } });
  }
}
