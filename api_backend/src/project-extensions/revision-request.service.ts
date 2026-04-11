import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevisionRequestService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, description: string, requestedBy: string, documents: string[] = []) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');

    const [revision] = await this.prisma.$transaction([
      this.prisma.revisionRequest.create({
        data: { projectId, description, requestedBy, documents },
      }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { revisionCount: { increment: 1 } },
      }),
    ]);

    return revision;
  }

  async findAll(projectId: string) {
    return this.prisma.revisionRequest.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
