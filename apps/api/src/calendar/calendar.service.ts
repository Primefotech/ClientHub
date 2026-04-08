import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateEventDto {
  projectId: string;
  creativeId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  color?: string;
  status?: string;
  platform?: string;
}

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getEvents(projectId: string, query: { dateFrom?: string; dateTo?: string; platform?: string }) {
    const { dateFrom, dateTo, platform } = query;
    const where: any = { projectId };
    if (platform) where.platform = platform;
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = new Date(dateFrom);
      if (dateTo) where.startDate.lte = new Date(dateTo);
    }

    return this.prisma.calendarEvent.findMany({
      where,
      include: {
        creative: {
          select: { id: true, title: true, fileType: true, thumbnailUrl: true, status: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async createEvent(dto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        creative: { select: { id: true, title: true, thumbnailUrl: true } },
      },
    });
  }

  async updateEvent(id: string, dto: Partial<CreateEventDto>) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  async getMonthView(projectId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.calendarEvent.findMany({
      where: {
        projectId,
        startDate: { gte: startDate, lte: endDate },
      },
      include: {
        creative: { select: { id: true, title: true, status: true, fileType: true, thumbnailUrl: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
