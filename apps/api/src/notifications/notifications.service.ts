import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  tenantId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  async createBulk(dtos: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({ data: dtos });
  }

  async getForUser(userId: string, query: { unreadOnly?: any; page?: any; limit?: any }) {
    const unreadOnly = String(query.unreadOnly) === 'true';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    // In production: integrate with SendGrid or SMTP via nodemailer
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return { sent: true };
  }

  async sendWhatsApp(to: string, message: string) {
    // In production: integrate with WhatsApp Cloud API
    const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { body: message },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return response.ok ? { sent: true } : { sent: false, error: 'API error' };
    } catch {
      return { sent: false, error: 'Network error' };
    }
  }

  async notifyProjectUsers(
    projectId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, any>,
    excludeUserId?: string,
  ) {
    const projectUsers = await this.prisma.projectUser.findMany({
      where: { projectId },
      include: { user: { select: { id: true } } },
    });

    const notifications = projectUsers
      .filter((pu) => pu.userId !== excludeUserId)
      .map((pu) => ({ userId: pu.userId, type, title, body, data }));

    if (notifications.length > 0) {
      await this.createBulk(notifications);
    }

    return { notified: notifications.length };
  }
}
