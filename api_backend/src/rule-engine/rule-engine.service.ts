import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RuleEngineService {
  constructor(private prisma: PrismaService) {}

  async getConfig(projectId: string, module: string) {
    return this.prisma.ruleEngineConfig.findUnique({
      where: { projectId_module: { projectId, module } },
    });
  }

  async upsertConfig(projectId: string, module: string, rules: any[], userId: string, userRole: Role) {
    const existing = await this.getConfig(projectId, module);

    if (existing?.isLocked && userRole !== Role.SUPER_ADMIN) {
      throw new Error('Rule configuration is locked. Contact Super Admin.');
    }

    return this.prisma.ruleEngineConfig.upsert({
      where: { projectId_module: { projectId, module } },
      create: { projectId, module, rules },
      update: { rules },
    });
  }

  async lockConfig(projectId: string, module: string) {
    return this.prisma.ruleEngineConfig.update({
      where: { projectId_module: { projectId, module } },
      data: { isLocked: true },
    });
  }

  async unlockConfig(projectId: string, module: string) {
    return this.prisma.ruleEngineConfig.update({
      where: { projectId_module: { projectId, module } },
      data: { isLocked: false },
    });
  }

  async evaluateRules(projectId: string, module: string, context: Record<string, any>) {
    const config = await this.getConfig(projectId, module);
    if (!config) return { matched: [], actions: [] };

    const rules = config.rules as any[];
    const matched = [];
    const actions = [];

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        matched.push(rule);
        actions.push(...(rule.actions || []));
      }
    }

    return { matched, actions };
  }

  private evaluateConditions(conditions: any[], context: Record<string, any>): boolean {
    if (!conditions || !conditions.length) return true;

    return conditions.every((cond) => {
      const value = context[cond.field];
      switch (cond.operator) {
        case 'eq': return value === cond.value;
        case 'neq': return value !== cond.value;
        case 'gt': return value > cond.value;
        case 'lt': return value < cond.value;
        case 'contains': return String(value).includes(cond.value);
        case 'in': return Array.isArray(cond.value) && cond.value.includes(value);
        default: return true;
      }
    });
  }

  async getAllConfigs(projectId: string) {
    return this.prisma.ruleEngineConfig.findMany({ where: { projectId } });
  }
}
