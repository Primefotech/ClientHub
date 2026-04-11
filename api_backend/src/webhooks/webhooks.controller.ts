import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Response } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get('configs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  getConfigs(@Query('tenantId') tenantId: string) {
    return this.webhooksService.getConfigs(tenantId);
  }

  @Post('configs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PROJECT_HEAD)
  createConfig(@Body() dto: any, @CurrentUser() user: any) {
    return this.webhooksService.createConfig(dto.tenantId, dto, user.id);
  }

  @Delete('configs/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  deleteConfig(@Param('id') id: string) {
    return this.webhooksService.deleteConfig(id);
  }

  // Meta Ads webhook (public endpoint)
  @Public()
  @Get('meta/:webhookId')
  async verifyMeta(
    @Param('webhookId') webhookId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe') {
      const result = await this.webhooksService.verifyMeta(token, challenge);
      if (result) return res.status(200).send(result);
    }
    return res.status(403).send('Forbidden');
  }

  @Public()
  @Post('meta/:webhookId')
  handleMetaLead(@Param('webhookId') webhookId: string, @Body() payload: any) {
    return this.webhooksService.handleMetaLead(payload, webhookId);
  }

  @Public()
  @Post('whatsapp')
  handleWhatsApp(@Body() payload: any) {
    return this.webhooksService.handleWhatsAppMessage(payload);
  }
}
