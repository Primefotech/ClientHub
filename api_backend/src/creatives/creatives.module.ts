import { Module } from '@nestjs/common';
import { CreativesController } from './creatives.controller';
import { CreativesService } from './creatives.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [CreativesController],
  providers: [CreativesService],
  exports: [CreativesService],
})
export class CreativesModule {}
