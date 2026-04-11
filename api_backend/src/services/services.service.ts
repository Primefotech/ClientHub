import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateServiceDto {
  name: string;
  description?: string;
  hasCRM?: boolean;
  hasCalendar?: boolean;
  hasWebDev?: boolean;
  hasAdReporting?: boolean;
}

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: dto,
    });
  }

  async update(id: string, dto: Partial<CreateServiceDto>) {
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
