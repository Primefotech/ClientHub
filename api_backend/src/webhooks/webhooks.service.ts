import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmService } from '../crm/crm.service';
import { WebhookEvent, LeadSource } from '@prisma/client';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private crmService: CrmService,
  ) {}

  async getConfigs(tenantId: string) {
    return this.prisma.webhookConfig.findMany({
      where: { tenantId },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async createConfig(tenantId: string, dto: any, userId: string) {
    const secretToken = `wh_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    return this.prisma.webhookConfig.create({
      data: { ...dto, tenantId, secretToken, createdById: userId },
    });
  }

  async handleMetaLead(payload: any, webhookId: string) {
    const config = await this.prisma.webhookConfig.findUnique({ where: { id: webhookId } });
    if (!config || !config.isActive) return { handled: false };

    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadData = changes?.value;

    if (!leadData) return { handled: false };

    const mapping = (config.fieldMapping as any) || {
      name: 'full_name',
      email: 'email',
      phone: 'phone_number',
    };

    await this.crmService.webhookCreateLead(
      config.projectId!,
      webhookId,
      leadData,
      mapping,
    );

    return { handled: true };
  }

  async handleWhatsAppMessage(payload: any) {
    // Process WhatsApp Cloud API webhook messages
    const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || !messages.length) return { handled: false };

    for (const message of messages) {
      console.log('[WhatsApp] Incoming message:', message);
      // Future: route to conversation system, auto-reply, etc.
    }

    return { handled: true };
  }

  async verifyMeta(token: string, challenge: string) {
    if (token === process.env.META_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }

  async deleteConfig(id: string) {
    return this.prisma.webhookConfig.delete({ where: { id } });
  }
}
