import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/communications')
export class CommunicationsController {
  constructor(private commsService: CommunicationsService) {}

  @Get('threads')
  getThreads(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Query('creativeId') creativeId?: string,
  ) {
    return this.commsService.getThreads(projectId, user.id, user.role, creativeId);
  }

  @Get('threads/:threadId')
  getThread(@Param('threadId') threadId: string, @CurrentUser() user: any) {
    return this.commsService.getThread(threadId, user.id, user.role);
  }

  @Get('chat')
  getProjectChat(@Param('projectId') projectId: string) {
    return this.commsService.getProjectChat(projectId);
  }

  @Post('threads')
  createThread(
    @Param('projectId') projectId: string,
    @Body() dto: { title?: string; creativeId?: string; type?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.commsService.createThread(projectId, dto, userId);
  }

  @Post('threads/:threadId/comments')
  addComment(
    @Param('threadId') threadId: string,
    @Body() dto: { content: string; attachments?: string[]; mentions?: string[]; parentId?: string },
    @CurrentUser() user: any,
  ) {
    return this.commsService.addComment(threadId, dto, user.id, user.role);
  }

  @Patch('comments/:commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commsService.updateComment(commentId, content, userId);
  }

  @Patch('threads/:threadId/resolve')
  resolveThread(@Param('threadId') threadId: string, @CurrentUser() user: any) {
    return this.commsService.resolveThread(threadId, user.id, user.role);
  }
}
