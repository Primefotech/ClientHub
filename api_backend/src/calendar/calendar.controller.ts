import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CalendarService, CreateEventDto } from './calendar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  getEvents(
    @Param('projectId') projectId: string,
    @Query() query: { dateFrom?: string; dateTo?: string; platform?: string },
  ) {
    return this.calendarService.getEvents(projectId, query);
  }

  @Get('month/:year/:month')
  getMonthView(
    @Param('projectId') projectId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.calendarService.getMonthView(projectId, +year, +month);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  createEvent(@Body() dto: CreateEventDto) {
    return this.calendarService.createEvent(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  updateEvent(@Param('id') id: string, @Body() dto: Partial<CreateEventDto>) {
    return this.calendarService.updateEvent(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  deleteEvent(@Param('id') id: string) {
    return this.calendarService.deleteEvent(id);
  }
}
