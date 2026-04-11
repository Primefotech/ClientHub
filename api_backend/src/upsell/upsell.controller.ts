import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UpsellService, CreateUpsellDto } from './upsell.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('upsell')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/upsell')
export class UpsellController {
  constructor(private upsellService: UpsellService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: { status?: string; page?: number; limit?: number },
  ) {
    return this.upsellService.findAll(projectId, query);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  create(@Body() dto: CreateUpsellDto, @CurrentUser('id') userId: string) {
    return this.upsellService.create(dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser('id') userId: string) {
    return this.upsellService.updateStatus(id, status, userId);
  }

  @Patch(':id/viewed')
  markViewed(@Param('id') id: string) {
    return this.upsellService.markViewed(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  delete(@Param('id') id: string) {
    return this.upsellService.delete(id);
  }
}
