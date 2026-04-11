import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogDto {
  projectId?: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(dto: LogDto) {
    try {
      return await this.prisma.activityLog.create({ data: dto });
    } catch {
      // Non-fatal — don't break main flows
      console.error('Failed to write activity log:', dto);
    }
  }

  async getProjectLogs(projectId: string, query: { entity?: string; userId?: string; page?: number; limit?: number }) {
    const { entity, userId, page = 1, limit = 50 } = query;
    const where: any = { projectId };
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getGlobalLogs(query: { entity?: string; userId?: string; page?: number; limit?: number }) {
    const { entity, userId, page = 1, limit = 50 } = query;
    const where: any = {};
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}
