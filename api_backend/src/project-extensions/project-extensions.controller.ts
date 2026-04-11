import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MeetingRequestService } from './meeting-request.service';
import { SupportTicketService } from './support-ticket.service';
import { RevisionRequestService } from './revision-request.service';

@ApiTags('project-extensions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/extensions')
export class ProjectExtensionsController {
  constructor(
    private meetingRequests: MeetingRequestService,
    private supportTickets: SupportTicketService,
    private revisionRequests: RevisionRequestService,
  ) {}

  // Meeting Requests
  @Post('meetings')
  requestMeeting(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body('agenda') agenda: string,
  ) {
    return this.meetingRequests.create(projectId, req.user.id, agenda);
  }

  @Get('meetings')
  getMeetings(@Param('projectId') projectId: string) {
    return this.meetingRequests.findAll(projectId);
  }

  @Patch('meetings/:id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  updateMeeting(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('scheduledAt') scheduledAt?: Date,
  ) {
    return this.meetingRequests.updateStatus(id, status, scheduledAt);
  }

  // Support Tickets
  @Post('tickets')
  createTicket(
    @Param('projectId') projectId: string,
    @Body() dto: { subject: string; description: string },
  ) {
    return this.supportTickets.create(projectId, dto.subject, dto.description);
  }

  @Get('tickets')
  getTickets(@Param('projectId') projectId: string) {
    return this.supportTickets.findAll(projectId);
  }

  @Patch('tickets/:id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.BRANDBOOK_STAFF)
  updateTicket(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('priority') priority?: string,
  ) {
    return this.supportTickets.updateStatus(id, status, priority);
  }

  // Revision Requests
  @Post('revisions')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  createRevision(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body() dto: { description: string; documents?: string[] },
  ) {
    return this.revisionRequests.create(projectId, dto.description, req.user.name, dto.documents);
  }

  @Get('revisions')
  getRevisions(@Param('projectId') projectId: string) {
    return this.revisionRequests.findAll(projectId);
  }
}
