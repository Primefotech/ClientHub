import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingMode, FieldType } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

export interface CreateFormDto {
  projectId?: string;
  isGlobal?: boolean;
  title: string;
  description?: string;
  mode?: OnboardingMode;
}

export interface AddFieldDto {
  formId: string;
  label: string;
  fieldType?: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  options?: any[];
  order?: number;
  sectionLabel?: string;
}

export interface SubmitResponseDto {
  formId: string;
  responses: Array<{ fieldId: string; value?: string; fileUrl?: string }>;
}

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async getForms(projectId: string | null, isGlobal: boolean = false) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (isGlobal || projectId === null) where.isGlobal = true;

    return this.prisma.onboardingForm.findMany({
      where,
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForm(id: string) {
    const form = await this.prisma.onboardingForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
          include: {
            responses: true,
            edits: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        responses: true,
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async getFormByToken(token: string) {
    const form = await this.prisma.onboardingForm.findUnique({
      where: { shareToken: token },
      include: {
        fields: { orderBy: { order: 'asc' } },
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async createForm(dto: CreateFormDto, userId: string) {
    const shareToken = `ob_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const form = await this.prisma.onboardingForm.create({
      data: { ...dto, shareToken, isGlobal: dto.isGlobal || false },
    });

    if (dto.projectId) {
      await this.activityLogs.log({
        projectId: dto.projectId,
        userId,
        action: 'ONBOARDING_FORM_CREATED',
        entity: 'onboarding_form',
        entityId: form.id,
        details: { title: dto.title, mode: dto.mode },
      });
    }

    return form;
  }

  async addField(dto: AddFieldDto, userId: string) {
    const form = await this.prisma.onboardingForm.findUnique({ where: { id: dto.formId } });
    if (!form) throw new NotFoundException('Form not found');

    const field = await this.prisma.onboardingField.create({ data: dto });

    await this.activityLogs.log({
      projectId: form.projectId,
      userId,
      action: 'ONBOARDING_FIELD_ADDED',
      entity: 'onboarding_field',
      entityId: field.id,
      details: { label: dto.label, fieldType: dto.fieldType },
    });

    return field;
  }

  async updateField(fieldId: string, dto: Partial<AddFieldDto>, userId: string) {
    const field = await this.prisma.onboardingField.findUnique({
      where: { id: fieldId },
      include: { form: true },
    });
    if (!field) throw new NotFoundException('Field not found');

    const updated = await this.prisma.onboardingField.update({ where: { id: fieldId }, data: dto });

    await this.activityLogs.log({
      projectId: field.form.projectId,
      userId,
      action: 'ONBOARDING_FIELD_UPDATED',
      entity: 'onboarding_field',
      entityId: fieldId,
      details: dto,
    });

    return updated;
  }

  async submitResponses(dto: SubmitResponseDto, userId: string) {
    const form = await this.prisma.onboardingForm.findUnique({ where: { id: dto.formId } });
    if (!form) throw new NotFoundException('Form not found');

    const upserts = dto.responses.map((r) =>
      this.prisma.onboardingResponse.upsert({
        where: { formId_fieldId: { formId: dto.formId, fieldId: r.fieldId } },
        create: { formId: dto.formId, fieldId: r.fieldId, value: r.value, fileUrl: r.fileUrl },
        update: { value: r.value, fileUrl: r.fileUrl },
      }),
    );

    // Track edits for each response
    const fieldEdits = dto.responses.map((r) =>
      this.prisma.onboardingFieldEdit.create({
        data: {
          fieldId: r.fieldId,
          editedById: userId,
          newValue: r.value,
        },
      }),
    );

    await Promise.all([...upserts, ...fieldEdits]);

    await this.activityLogs.log({
      projectId: form.projectId,
      userId,
      action: 'ONBOARDING_RESPONSE_SUBMITTED',
      entity: 'onboarding_form',
      entityId: dto.formId,
      details: { fieldsSubmitted: dto.responses.length },
    });

    return { message: 'Responses saved successfully', count: dto.responses.length };
  }

  async publishForm(id: string, userId: string) {
    const form = await this.prisma.onboardingForm.update({
      where: { id },
      data: { isPublished: true },
    });

    await this.activityLogs.log({
      projectId: form.projectId,
      userId,
      action: 'ONBOARDING_FORM_PUBLISHED',
      entity: 'onboarding_form',
      entityId: id,
      details: {},
    });

    return form;
  }

  async unpublishForm(id: string) {
    return this.prisma.onboardingForm.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async deleteForm(id: string) {
    return this.prisma.onboardingForm.delete({
      where: { id },
    });
  }

  async getEditHistory(fieldId: string) {
    return this.prisma.onboardingFieldEdit.findMany({
      where: { fieldId },
      include: { editedBy: { select: { id: true, name: true, role: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
