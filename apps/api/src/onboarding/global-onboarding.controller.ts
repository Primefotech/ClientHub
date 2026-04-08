import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OnboardingService, CreateFormDto, AddFieldDto } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('global-onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('global-onboarding')
export class GlobalOnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF, Role.PROJECT_HEAD)
  getForms() {
    return this.onboardingService.getForms(null, true);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF)
  createForm(@Body() dto: CreateFormDto, @CurrentUser('id') userId: string) {
    return this.onboardingService.createForm({ ...dto, isGlobal: true }, userId);
  }

  @Post(':formId/fields')
  @Roles(Role.SUPER_ADMIN, Role.BRANDBOOK_STAFF)
  addField(@Param('formId') formId: string, @Body() dto: AddFieldDto, @CurrentUser('id') userId: string) {
    return this.onboardingService.addField({ ...dto, formId }, userId);
  }
}
