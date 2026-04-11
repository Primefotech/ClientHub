import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RuleEngineService } from './rule-engine.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('rule-engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/rules')
export class RuleEngineController {
  constructor(private ruleEngineService: RuleEngineService) {}

  @Get()
  getAllConfigs(@Param('projectId') projectId: string) {
    return this.ruleEngineService.getAllConfigs(projectId);
  }

  @Get(':module')
  getConfig(@Param('projectId') projectId: string, @Param('module') module: string) {
    return this.ruleEngineService.getConfig(projectId, module);
  }

  @Post(':module')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  upsertConfig(
    @Param('projectId') projectId: string,
    @Param('module') module: string,
    @Body('rules') rules: any[],
    @CurrentUser() user: any,
  ) {
    return this.ruleEngineService.upsertConfig(projectId, module, rules, user.id, user.role);
  }

  @Patch(':module/lock')
  @Roles(Role.PROJECT_HEAD)
  lockConfig(@Param('projectId') projectId: string, @Param('module') module: string) {
    return this.ruleEngineService.lockConfig(projectId, module);
  }

  @Patch(':module/unlock')
  @Roles(Role.SUPER_ADMIN)
  unlockConfig(@Param('projectId') projectId: string, @Param('module') module: string) {
    return this.ruleEngineService.unlockConfig(projectId, module);
  }
}
