import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, ContentStatus, ApprovalAction } from '@prisma/client';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: { status?: ContentStatus; page?: number; limit?: number },
  ) {
    return this.approvalsService.findAll(projectId, query);
  }

  @Get('audit-logs')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  getAuditLogs(
    @Param('projectId') projectId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.approvalsService.getAuditLogs(projectId, query);
  }

  @Get('rules')
  getApprovalRules(@Param('projectId') projectId: string) {
    return this.approvalsService.getApprovalRules(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(':id/act')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.CLIENT_OWNER)
  act(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { action: ApprovalAction; comment?: string },
  ) {
    return this.approvalsService.act(id, userId, body.action, body.comment);
  }

  @Post('rules')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  upsertRule(@Param('projectId') projectId: string, @Body() dto: any) {
    return this.approvalsService.upsertApprovalRule(projectId, dto);
  }

  @Patch('rules/:ruleId/lock')
  @Roles(Role.PROJECT_HEAD)
  lockRule(@Param('ruleId') ruleId: string, @CurrentUser('id') userId: string) {
    return this.approvalsService.lockRule(ruleId, userId);
  }

  @Patch('rules/:ruleId/unlock')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  unlockRule(@Param('ruleId') ruleId: string) {
    return this.approvalsService.unlockRule(ruleId);
  }

  @Post('process-deadlines')
  @Roles(Role.SUPER_ADMIN)
  processDeadlines() {
    return this.approvalsService.processDeadlines();
  }
}
