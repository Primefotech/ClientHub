import { Module } from '@nestjs/common';
import { MeetingRequestService } from './meeting-request.service';
import { SupportTicketService } from './support-ticket.service';
import { RevisionRequestService } from './revision-request.service';
import { ProjectExtensionsController } from './project-extensions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProjectExtensionsController],
  providers: [MeetingRequestService, SupportTicketService, RevisionRequestService],
  exports: [MeetingRequestService, SupportTicketService, RevisionRequestService],
})
export class ProjectExtensionsModule {}
