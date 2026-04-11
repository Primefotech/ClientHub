import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('global-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('global-reports')
export class GlobalReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF)
  getGlobalStats() {
    return this.reportsService.getGlobalStats();
  }

  @Get('staff-performance')
  @Roles(Role.SUPER_ADMIN)
  getStaffPerformance() {
    return this.reportsService.getStaffPerformance();
  }
}
