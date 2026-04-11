import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ContentTypesService, CreateContentTypeDto } from './content-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('content-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('content-types')
export class ContentTypesController {
  constructor(private contentTypesService: ContentTypesService) {}

  @Get()
  findAll(@Query() query: { projectId?: string; isGlobal?: boolean; includeArchived?: boolean }) {
    return this.contentTypesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentTypesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  create(@Body() dto: CreateContentTypeDto, @CurrentUser() user: any) {
    return this.contentTypesService.create(dto, user.id, user.role);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  update(@Param('id') id: string, @Body() dto: Partial<CreateContentTypeDto>) {
    return this.contentTypesService.update(id, dto);
  }

  @Patch(':id/archive')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  archive(@Param('id') id: string) {
    return this.contentTypesService.archive(id);
  }

  @Patch(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  restore(@Param('id') id: string) {
    return this.contentTypesService.restore(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.contentTypesService.delete(id);
  }
}
