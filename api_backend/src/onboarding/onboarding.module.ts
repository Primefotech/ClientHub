import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { GlobalOnboardingController } from './global-onboarding.controller';

@Module({
  imports: [ActivityLogsModule],
  controllers: [OnboardingController, GlobalOnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
