import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService, CreateAdReportDto } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: { platform?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number },
  ) {
    return this.reportsService.findAll(projectId, query);
  }

  @Get('aggregated')
  getAggregated(
    @Param('projectId') projectId: string,
    @Query() query: { dateFrom?: string; dateTo?: string; groupBy?: string },
  ) {
    return this.reportsService.getAggregated(projectId, query);
  }

  @Get('time-series')
  getTimeSeries(
    @Param('projectId') projectId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getTimeSeries(projectId, dateFrom, dateTo);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  create(@Body() dto: CreateAdReportDto, @CurrentUser('id') userId: string) {
    return this.reportsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  update(@Param('id') id: string, @Body() dto: Partial<CreateAdReportDto>) {
    return this.reportsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
