import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OnboardingService, CreateFormDto, AddFieldDto, SubmitResponseDto } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get()
  getForms(@Param('projectId') projectId: string) {
    return this.onboardingService.getForms(projectId);
  }

  @Get(':id')
  getForm(@Param('id') id: string) {
    return this.onboardingService.getForm(id);
  }

  @Public()
  @Get('token/:token')
  getFormByToken(@Param('token') token: string) {
    return this.onboardingService.getFormByToken(token);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  createForm(@Body() dto: CreateFormDto, @CurrentUser('id') userId: string) {
    return this.onboardingService.createForm(dto, userId);
  }

  @Post('fields')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  addField(@Body() dto: AddFieldDto, @CurrentUser('id') userId: string) {
    return this.onboardingService.addField(dto, userId);
  }

  @Patch('fields/:fieldId')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  updateField(@Param('fieldId') fieldId: string, @Body() dto: Partial<AddFieldDto>, @CurrentUser('id') userId: string) {
    return this.onboardingService.updateField(fieldId, dto, userId);
  }

  @Post('responses')
  submitResponses(@Body() dto: SubmitResponseDto, @CurrentUser('id') userId: string) {
    return this.onboardingService.submitResponses(dto, userId);
  }

  @Patch(':id/publish')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  publishForm(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.onboardingService.publishForm(id, userId);
  }

  @Patch(':id/unpublish')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  unpublishForm(@Param('id') id: string) {
    return this.onboardingService.unpublishForm(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  deleteForm(@Param('id') id: string) {
    return this.onboardingService.deleteForm(id);
  }

  @Get('fields/:fieldId/history')
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  getEditHistory(@Param('fieldId') fieldId: string) {
    return this.onboardingService.getEditHistory(fieldId);
  }
}
