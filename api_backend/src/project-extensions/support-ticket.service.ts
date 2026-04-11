import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportTicketService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, subject: string, description: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (!project.supportSystemActive) {
      throw new BadRequestException('Support system is not active for this project (requires active SLA)');
    }

    return this.prisma.supportTicket.create({
      data: { projectId, subject, description },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.supportTicket.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, priority?: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status, ...(priority && { priority }) },
    });
  }
}
