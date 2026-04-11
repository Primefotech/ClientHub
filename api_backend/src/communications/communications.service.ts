import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class CommunicationsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async getThreads(projectId: string, userId: string, userRole: Role, creativeId?: string) {
    const where: any = { projectId };
    if (creativeId) where.creativeId = creativeId;

    // BrandBook staff can only see their own threads
    if (userRole === Role.BRANDBOOK_STAFF) {
      where.createdById = userId;
    }

    return this.prisma.thread.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        creative: { select: { id: true, title: true, fileType: true, thumbnailUrl: true } },
        _count: { select: { comments: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getThread(id: string, userId: string, userRole: Role) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true, role: true } },
        creative: { select: { id: true, title: true, fileType: true, fileUrl: true, thumbnailUrl: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
            replies: {
              include: { author: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
        },
      },
    });

    if (!thread) throw new NotFoundException('Thread not found');

    // BrandBook staff can only access their own threads
    if (userRole === Role.BRANDBOOK_STAFF && thread.createdById !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return thread;
  }

  async createThread(projectId: string, dto: { title?: string; creativeId?: string; type?: string }, userId: string) {
    const thread = await this.prisma.thread.create({
      data: {
        projectId,
        createdById: userId,
        title: dto.title,
        creativeId: dto.creativeId,
        type: dto.type || 'content',
      },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    await this.activityLogs.log({
      projectId,
      userId,
      action: 'THREAD_CREATED',
      entity: 'thread',
      entityId: thread.id,
      details: { title: dto.title },
    });

    return thread;
  }

  async addComment(
    threadId: string,
    dto: { content: string; attachments?: string[]; mentions?: string[]; parentId?: string },
    userId: string,
    userRole: Role,
  ) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');

    // BrandBook staff can only comment on their own threads
    if (userRole === Role.BRANDBOOK_STAFF && thread.createdById !== userId) {
      throw new ForbiddenException('You can only comment in your own threads');
    }

    const comment = await this.prisma.comment.create({
      data: {
        threadId,
        authorId: userId,
        content: dto.content,
        attachments: dto.attachments || [],
        mentions: dto.mentions || [],
        parentId: dto.parentId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Update thread timestamp
    await this.prisma.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

    await this.activityLogs.log({
      projectId: thread.projectId,
      userId,
      action: 'COMMENT_ADDED',
      entity: 'comment',
      entityId: comment.id,
      details: { threadId, content: dto.content.substring(0, 100) },
    });

    return comment;
  }

  async updateComment(commentId: string, content: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('You can only edit your own comments');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async resolveThread(threadId: string, userId: string, userRole: Role) {
    if (!([Role.SUPER_ADMIN, Role.PROJECT_HEAD, Role.CLIENT_OWNER] as Role[]).includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.prisma.thread.update({ 
      where: { id: threadId }, 
      data: { isResolved: true } as any 
    });
  }

  async getProjectChat(projectId: string) {
    return this.prisma.thread.findMany({
      where: { projectId, type: 'project', creativeId: null },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: { author: { select: { id: true, name: true, avatar: true, role: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
