'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { commsApi } from '@/lib/api';
import { Thread, Comment } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import { useSocket } from '@/hooks/useSocket';
import { MessageSquare, Send, CheckCheck, Plus, User2 } from 'lucide-react';

function CommentBubble({ comment, isOwn }: { comment: Comment; isOwn: boolean }) {
  return (
    <div className={cn('flex gap-2.5 max-w-[80%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
        {comment.author?.avatar ? (
          <img src={comment.author.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
        ) : (
          <span className="text-xs font-bold text-gray-500">
            {comment.author?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </span>
        )}
      </div>
      <div>
        <div className={cn('flex items-center gap-2 mb-1', isOwn ? 'flex-row-reverse' : '')}>
          <span className="text-xs font-medium text-gray-700">{comment.author?.name}</span>
          {comment.author?.role && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', ROLE_COLORS[comment.author.role])}>
              {ROLE_LABELS[comment.author.role]}
            </span>
          )}
          <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
        </div>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-brandbook-500 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm',
        )}>
          {comment.content}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2">
            {comment.replies.map((r) => <CommentBubble key={r.id} comment={r} isOwn={false} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunicationsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, emit } = useSocket(projectId);

  const canCreateThread = ['SUPER_ADMIN', 'PROJECT_HEAD', 'CLIENT_OWNER'].includes(user?.role || '');

  const { data: threads } = useQuery({
    queryKey: ['threads', projectId],
    queryFn: () => commsApi.getThreads(projectId),
  });

  const { data: currentThread } = useQuery({
    queryKey: ['thread', projectId, selectedThread],
    queryFn: () => commsApi.getThread(projectId, selectedThread!),
    enabled: !!selectedThread,
  });

  useEffect(() => {
    if (selectedThread) {
      emit('join-thread', selectedThread);
    }
  }, [selectedThread, emit]);

  useEffect(() => {
    const cleanup = on('new-comment', (comment: Comment) => {
      qc.invalidateQueries({ queryKey: ['thread', projectId, selectedThread] });
    });
    return cleanup;
  }, [on, qc, projectId, selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.comments]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      commsApi.addComment(projectId, selectedThread!, { content }),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['thread', projectId, selectedThread] });
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: () => commsApi.createThread(projectId, { title: newThreadTitle, type: 'project' }),
    onSuccess: (thread: any) => {
      qc.invalidateQueries({ queryKey: ['threads', projectId] });
      setSelectedThread(thread.id);
      setShowNewThread(false);
      setNewThreadTitle('');
    },
  });

  const threadList: Thread[] = Array.isArray(threads) ? threads : [];
  const comments: Comment[] = currentThread?.comments || [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedThread) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <div className="flex flex-col h-full">
      <Header user={user!} title="Communications" subtitle="Threads & Messages" />

      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-100">
            {canCreateThread && (
              <button
                onClick={() => setShowNewThread(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-brandbook-50 hover:bg-brandbook-100 text-brandbook-600 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> New Thread
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadList.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No threads yet
              </div>
            ) : (
              threadList.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    selectedThread === thread.id && 'bg-brandbook-50 border-l-2 border-l-brandbook-500',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {thread.title || thread.creative?.title || 'Thread'}
                    </p>
                    {thread.isResolved && <CheckCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{thread._count?.comments || 0} replies</span>
                    {thread.comments?.[0] && (
                      <span className="text-xs text-gray-300">· {formatRelativeTime(thread.comments[0].createdAt)}</span>
                    )}
                  </div>
                  {thread.comments?.[0] && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {thread.comments[0].author?.name}: {thread.comments[0].content}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select a thread to view messages</p>
                <p className="text-sm mt-1">Or create a new thread to start a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currentThread?.title || currentThread?.creative?.title || 'Thread'}
                  </h3>
                  {currentThread?.creative && (
                    <p className="text-xs text-gray-500">
                      Linked to: {currentThread.creative.title}
                    </p>
                  )}
                </div>
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  currentThread?.isResolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                )}>
                  {currentThread?.isResolved ? 'Resolved' : 'Active'}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No messages yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentBubble
                      key={comment.id}
                      comment={comment}
                      isOwn={comment.author?.id === user?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brandbook-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brandbook-600">
                      {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sendMutation.isPending}
                    className="w-10 h-10 bg-brandbook-500 text-white rounded-xl flex items-center justify-center hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Thread</h2>
            <input
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => createThreadMutation.mutate()}
                disabled={!newThreadTitle.trim()}
                className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button onClick={() => setShowNewThread(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
