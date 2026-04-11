import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

export interface CreateUpsellDto {
  projectId?: string;
  isGlobal?: boolean;
  title: string;
  description: string;
  category: string;
  priority?: string;
  estimatedValue?: number;
  currency?: string;
  status?: string;
  attachments?: string[];
}

@Injectable()
export class UpsellService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string | null, query: { status?: string; isGlobal?: boolean; page?: number; limit?: number }) {
    const { status, isGlobal, page = 1, limit = 20 } = query;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (isGlobal !== undefined) where.isGlobal = isGlobal;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.upsellRecommendation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { createdBy: { select: { id: true, name: true, avatar: true } } },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.upsellRecommendation.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async create(dto: CreateUpsellDto, userId: string) {
    const item = await this.prisma.upsellRecommendation.create({
      data: { ...dto, createdById: userId, isGlobal: dto.isGlobal || false },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (dto.projectId) {
      await this.activityLogs.log({
        projectId: dto.projectId,
        userId,
        action: 'UPSELL_CREATED',
        entity: 'upsell_recommendation',
        entityId: item.id,
        details: { title: dto.title, category: dto.category },
      });

      if (dto.status === 'INTERESTED') {
         await this.notifications.notifyProjectUsers(
           dto.projectId,
           NotificationType.UPSELL_ADDED,
           'New Upsell Interest',
           `A client has selected the upsell service: ${dto.title}. Please proceed.`,
           { upsellId: item.id },
           userId
         );
      }
    }

    return item;
  }

  async updateStatus(id: string, status: string, userId: string) {
    return this.prisma.upsellRecommendation.update({
      where: { id },
      data: { status },
    });
  }

  async markViewed(id: string) {
    return this.prisma.upsellRecommendation.update({
      where: { id },
      data: { viewedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.upsellRecommendation.delete({ where: { id } });
  }
}
