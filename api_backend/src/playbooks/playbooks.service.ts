import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePlaybookDto {
  slug: string;
  title: string;
  content: any;
  type: string;
}

@Injectable()
export class PlaybooksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.playbook.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const playbook = await this.prisma.playbook.findUnique({
      where: { slug },
    });
    if (!playbook) throw new NotFoundException('Playbook not found');
    return playbook;
  }

  async upsert(dto: CreatePlaybookDto) {
    return this.prisma.playbook.upsert({
      where: { slug: dto.slug },
      update: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
      },
      create: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.playbook.delete({ where: { id } });
  }
}
