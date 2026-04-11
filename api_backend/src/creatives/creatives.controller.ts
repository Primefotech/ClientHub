import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, ContentStatus } from '@prisma/client';
import { CreativesService, CreateCreativeDto } from './creatives.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('creatives')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/creatives')
export class CreativesController {
  constructor(private creativesService: CreativesService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: { status?: ContentStatus; fileType?: string; page?: number; limit?: number },
  ) {
    return this.creativesService.findAll(projectId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creativesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  create(@Body() dto: CreateCreativeDto, @CurrentUser('id') userId: string) {
    return this.creativesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  update(@Param('id') id: string, @Body() dto: Partial<CreateCreativeDto>, @CurrentUser('id') userId: string) {
    return this.creativesService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  updateStatus(@Param('id') id: string, @Body('status') status: ContentStatus, @CurrentUser('id') userId: string) {
    return this.creativesService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  delete(@Param('id') id: string) {
    return this.creativesService.delete(id);
  }
}
