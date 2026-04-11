import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { GlobalReportsController } from './global-reports.controller';
import { ReportsService } from './reports.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [ReportsController, GlobalReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
