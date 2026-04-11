import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.globalSetting.findMany();
    return settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  }

  async getByKey(key: string) {
    const setting = await this.prisma.globalSetting.findUnique({ where: { key } });
    return setting ? setting.value : null;
  }

  async upsert(key: string, value: any) {
    return this.prisma.globalSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async bulkUpsert(settings: Record<string, any>) {
    const promises = Object.entries(settings).map(([key, value]) =>
      this.upsert(key, value)
    );
    await Promise.all(promises);
    return this.getAll();
  }
}
