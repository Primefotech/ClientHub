import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Role } from '@prisma/client';

@Injectable()
export class MeetingRequestService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(projectId: string, userId: string, agenda: string) {
    // Check monthly limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.meetingRequest.count({
      where: {
        projectId,
        createdAt: { gte: startOfMonth },
      },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { service: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const limit = (project.settings as any)?.meetingLimit || 2;
    if (count >= limit) {
      throw new BadRequestException(`Monthly meeting limit reached (${limit} per month)`);
    }

    const request = await this.prisma.meetingRequest.create({
      data: { projectId, requesterId: userId, agenda },
      include: { requester: { select: { name: true } } },
    });

    // Notify Project Manager and Admins
    const projectUsers = await this.prisma.projectUser.findMany({
      where: { 
        projectId,
        role: { in: [Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF] }
      },
      include: { user: { select: { id: true } } },
    });

    const notifications = projectUsers.map((pu) => ({
      userId: pu.userId,
      type: NotificationType.COMMENT_ADDED, // Using generic type for now or add MENTION
      title: 'New Meeting Request',
      body: `${request.requester.name} requested a meeting: ${agenda.substring(0, 50)}...`,
      data: { projectId, requestId: request.id },
    }));

    if (notifications.length > 0) {
      await this.notifications.createBulk(notifications);
    }

    return request;
  }

  async findAll(projectId: string) {
    return this.prisma.meetingRequest.findMany({
      where: { projectId },
      include: { requester: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, scheduledAt?: Date) {
    return this.prisma.meetingRequest.update({
      where: { id },
      data: { status, scheduledAt },
    });
  }
}
