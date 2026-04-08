import { Module } from '@nestjs/common';
import { UpsellController } from './upsell.controller';
import { UpsellService } from './upsell.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { GlobalUpsellController } from './global-upsell.controller';

@Module({
  imports: [ActivityLogsModule],
  controllers: [UpsellController, GlobalUpsellController],
  providers: [UpsellService],
  exports: [UpsellService],
})
export class UpsellModule {}
