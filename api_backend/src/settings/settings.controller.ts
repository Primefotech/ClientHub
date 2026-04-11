import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF)
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  getByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Patch()
  @Roles(Role.SUPER_ADMIN)
  updateAll(@Body() settings: Record<string, any>) {
    return this.settingsService.bulkUpsert(settings);
  }
}
