import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, ApprovalAction, Role } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string, query: { status?: ContentStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const where: any = { creative: { projectId } };
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creative: {
            include: {
              uploadedBy: { select: { id: true, name: true, avatar: true } },
              contentType: { select: { id: true, name: true, icon: true } },
            },
          },
          approvalLogs: {
            orderBy: { createdAt: 'desc' },
            include: { actionBy: { select: { id: true, name: true, avatar: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);

    return { requests, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        creative: {
          include: {
            uploadedBy: { select: { id: true, name: true, avatar: true } },
            contentType: true,
            threads: { include: { comments: { include: { author: { select: { id: true, name: true, avatar: true } } } } } },
          },
        },
        approvalLogs: {
          orderBy: { createdAt: 'desc' },
          include: { actionBy: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!request) throw new NotFoundException('Approval request not found');
    return request;
  }

  async act(id: string, userId: string, action: ApprovalAction, comment?: string) {
    const request = await this.findOne(id);

    const statusMap: Record<ApprovalAction, ContentStatus> = {
      [ApprovalAction.APPROVED]: ContentStatus.APPROVED,
      [ApprovalAction.REJECTED]: ContentStatus.REJECTED,
      [ApprovalAction.REVISION_REQUESTED]: ContentStatus.REVISION_REQUESTED,
      [ApprovalAction.AUTO_APPROVED]: ContentStatus.AUTO_APPROVED,
      [ApprovalAction.DEADLINE_PASSED]: ContentStatus.PENDING_APPROVAL,
    };

    const newStatus = statusMap[action];

    const [log, _, __] = await Promise.all([
      this.prisma.approvalLog.create({
        data: {
          approvalRequestId: id,
          actionById: userId,
          action,
          comment,
          timeTakenMinutes: request.createdAt
            ? Math.floor((Date.now() - request.createdAt.getTime()) / 60000)
            : null,
        },
      }),
      this.prisma.approvalRequest.update({ where: { id }, data: { status: newStatus } }),
      this.prisma.creative.update({ where: { id: request.creativeId }, data: { status: newStatus } }),
    ]);

    await this.activityLogs.log({
      projectId: request.creative.projectId,
      userId,
      action: `APPROVAL_${action}`,
      entity: 'approval_request',
      entityId: id,
      details: { action, comment, creativeId: request.creativeId },
    });

    // Notify creative uploader
    await this.notifications.create({
      userId: request.creative.uploadedById,
      type: 'APPROVAL_DECISION',
      title: `Creative ${action.toLowerCase().replace('_', ' ')}`,
      body: `Your creative "${request.creative.title}" has been ${action.toLowerCase().replace('_', ' ')}${comment ? `: ${comment}` : ''}`,
      data: { creativeId: request.creativeId, approvalRequestId: id, action },
    });

    return log;
  }

  async getApprovalRules(projectId: string) {
    return this.prisma.approvalRule.findMany({
      where: { projectId },
      orderBy: { priority: 'desc' },
    });
  }

  async upsertApprovalRule(projectId: string, dto: any) {
    if (dto.id) {
      return this.prisma.approvalRule.update({ where: { id: dto.id }, data: dto });
    }
    return this.prisma.approvalRule.create({ data: { ...dto, projectId } });
  }

  async lockRule(ruleId: string, lockedById: string) {
    return this.prisma.approvalRule.update({
      where: { id: ruleId },
      data: { isLocked: true, lockedById },
    });
  }

  async unlockRule(ruleId: string) {
    return this.prisma.approvalRule.update({
      where: { id: ruleId },
      data: { isLocked: false, lockedById: null },
    });
  }

  async getAuditLogs(projectId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    return this.prisma.approvalLog.findMany({
      where: { approvalRequest: { creative: { projectId } } },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actionBy: { select: { id: true, name: true, avatar: true, role: true } },
        approvalRequest: {
          include: { creative: { select: { id: true, title: true, fileType: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processDeadlines() {
    const overdueRequests = await this.prisma.approvalRequest.findMany({
      where: {
        status: ContentStatus.PENDING_APPROVAL,
        deadline: { lt: new Date() },
      },
      include: { creative: { include: { project: { include: { approvalRules: true } } } } },
    });

    for (const request of overdueRequests) {
      const rule = request.creative.project.approvalRules.find(
        (r) => !r.contentTypeId || r.contentTypeId === request.creative.contentTypeId,
      );

      if (rule?.autoApproveAfterDeadline) {
        await this.act(request.id, 'SYSTEM', ApprovalAction.AUTO_APPROVED, 'Auto-approved after deadline');
      } else {
        await this.prisma.approvalLog.create({
          data: {
            approvalRequestId: request.id,
            actionById: request.creative.uploadedById,
            action: ApprovalAction.DEADLINE_PASSED,
            comment: 'Approval deadline has passed',
          },
        });
      }
    }

    return { processed: overdueRequests.length };
  }
}
