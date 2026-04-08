import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  findAll(@Query() query: { role?: Role; tenantId?: string; search?: string; page?: number; limit?: number }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/assign-project')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  assignToProject(
    @Param('id') userId: string,
    @Body() body: { projectId: string; role: Role; permissions?: Record<string, any> },
  ) {
    return this.usersService.assignToProject(userId, body.projectId, body.role, body.permissions);
  }

  @Delete(':id/project/:projectId')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  removeFromProject(@Param('id') userId: string, @Param('projectId') projectId: string) {
    return this.usersService.removeFromProject(userId, projectId);
  }

  @Post(':id/assign-tenant')
  @Roles(Role.SUPER_ADMIN)
  assignToTenant(@Param('id') userId: string, @Body() body: { tenantId: string }) {
    return this.usersService.assignToTenant(userId, body.tenantId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
