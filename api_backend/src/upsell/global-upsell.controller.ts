import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UpsellService, CreateUpsellDto } from './upsell.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('global-upsell')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('global-upsell')
export class GlobalUpsellController {
  constructor(private upsellService: UpsellService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF, Role.PROJECT_HEAD, Role.CLIENT_OWNER)
  findAll(@Query() query: { status?: string; page?: number; limit?: number }) {
    return this.upsellService.findAll(null, { ...query, isGlobal: true });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF)
  create(@Body() dto: CreateUpsellDto, @CurrentUser('id') userId: string) {
    return this.upsellService.create({ ...dto, isGlobal: true }, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser('id') userId: string) {
    return this.upsellService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.upsellService.delete(id);
  }
}
