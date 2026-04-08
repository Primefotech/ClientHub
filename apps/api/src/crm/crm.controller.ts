import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { CrmService, CreateLeadDto, UpdateLeadDto } from './crm.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Query() query: { status?: LeadStatus; assignedToId?: string; search?: string; page?: number; limit?: number },
  ) {
    return this.crmService.findAll(projectId, user.id, user.role, query);
  }

  @Get('stats')
  getStats(@Param('projectId') projectId: string) {
    return this.crmService.getStats(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.crmService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: any) {
    return this.crmService.create({ ...dto, projectId: dto.projectId }, user.id, user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: any) {
    return this.crmService.update(id, dto, user.id, user.role);
  }
}
