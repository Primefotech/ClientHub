import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProjectsModule } from './projects/projects.module';
import { CreativesModule } from './creatives/creatives.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CrmModule } from './crm/crm.module';
import { CommunicationsModule } from './communications/communications.module';
import { ReportsModule } from './reports/reports.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ContentTypesModule } from './content-types/content-types.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';
import { UpsellModule } from './upsell/upsell.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { SettingsModule } from './settings/settings.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { ServicesModule } from './services/services.module';
import { ProjectExtensionsModule } from './project-extensions/project-extensions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    CreativesModule,
    ApprovalsModule,
    CrmModule,
    CommunicationsModule,
    ReportsModule,
    OnboardingModule,
    CalendarModule,
    NotificationsModule,
    WebhooksModule,
    ContentTypesModule,
    RuleEngineModule,
    UpsellModule,
    ActivityLogsModule,
    SettingsModule,
    PlaybooksModule,
    ServicesModule,
    ProjectExtensionsModule,
  ],
  providers: [],
})
export class AppModule {}
