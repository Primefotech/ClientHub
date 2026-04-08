'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { approvalsApi } from '@/lib/api';
import { ApprovalRequest, ContentStatus } from '@/types';
import { STATUS_COLORS, formatRelativeTime, formatDateTime, cn } from '@/lib/utils';
import {
  CheckCircle2, XCircle, MessageSquare, Clock, Filter,
  RotateCcw, Shield, AlertTriangle, ChevronRight, Lock,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Pending', value: 'PENDING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Revision', value: 'REVISION_REQUESTED' },
  { label: 'All', value: '' },
];

function ApprovalCard({ request, onAct, canAct }: {
  request: ApprovalRequest;
  onAct: (id: string, action: string, comment?: string) => void;
  canAct: boolean;
}) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const creative = request.creative as any;

  const handleAct = (action: string) => {
    if (action === 'REVISION_REQUESTED' || action === 'REJECTED') {
      setPendingAction(action);
      setShowComment(true);
    } else {
      onAct(request.id, action);
    }
  };

  const submitWithComment = () => {
    if (pendingAction) {
      onAct(request.id, pendingAction, comment);
      setShowComment(false);
      setComment('');
      setPendingAction(null);
    }
  };

  const isDeadlinePassed = request.deadline && new Date(request.deadline) < new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Thumbnail / File Type */}
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {creative?.thumbnailUrl ? (
              <img src={creative.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-3xl">
                {creative?.fileType === 'image' ? '🖼️' :
                 creative?.fileType === 'video' ? '🎬' :
                 creative?.fileType === 'carousel' ? '🎠' :
                 creative?.fileType === 'ad_copy' ? '✍️' : '📄'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{creative?.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Uploaded by{' '}
                  <span className="font-medium">{creative?.uploadedBy?.name}</span>
                  {' · '}{formatRelativeTime(request.createdAt)}
                </p>
              </div>
              <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0', STATUS_COLORS[request.status])}>
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Content type */}
            {creative?.contentType && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Type:</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{
                    backgroundColor: `${creative.contentType.color}20`,
                    color: creative.contentType.color,
                  }}
                >
                  {creative.contentType.icon} {creative.contentType.name}
                </span>
              </div>
            )}

            {/* Deadline */}
            {request.deadline && (
              <div className={cn('mt-2 flex items-center gap-1.5 text-xs', isDeadlinePassed ? 'text-red-500' : 'text-gray-500')}>
                {isDeadlinePassed ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {isDeadlinePassed ? 'Deadline passed:' : 'Deadline:'} {formatDateTime(request.deadline)}
              </div>
            )}

            {/* Round */}
            {request.round > 1 && (
              <p className="text-xs text-orange-600 mt-1">Round {request.round} of review</p>
            )}
          </div>
        </div>

        {/* Approval logs */}
        {request.approvalLogs && request.approvalLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity</p>
            {request.approvalLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 flex-shrink-0">{formatRelativeTime(log.createdAt)}</span>
                <span>
                  <span className="font-medium text-gray-700">{log.actionBy?.name}</span>{' '}
                  <span className={cn(
                    'font-medium',
                    log.action === 'APPROVED' || log.action === 'AUTO_APPROVED' ? 'text-green-600' :
                    log.action === 'REJECTED' ? 'text-red-600' : 'text-yellow-600',
                  )}>
                    {log.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  {log.comment && <span className="text-gray-500">: "{log.comment}"</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {canAct && request.status === 'PENDING_APPROVAL' && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAct('APPROVED')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => handleAct('REVISION_REQUESTED')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Request Revision
            </button>
            <button
              onClick={() => handleAct('REJECTED')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {/* Comment box */}
        {showComment && (
          <div className="mt-4 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Add a comment for ${pendingAction === 'REJECTED' ? 'rejection' : 'revision request'}...`}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={submitWithComment}
                className="px-4 py-2 bg-brandbook-500 text-white text-sm font-medium rounded-lg hover:bg-brandbook-600 transition-colors"
              >
                Submit
              </button>
              <button
                onClick={() => { setShowComment(false); setComment(''); setPendingAction(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');

  const canAct = ['SUPER_ADMIN', 'PROJECT_HEAD', 'CLIENT_OWNER'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', projectId, activeTab],
    queryFn: () => approvalsApi.list(projectId, { status: activeTab || undefined }),
  });

  const actMutation = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: string; comment?: string }) =>
      approvalsApi.act(projectId, id, action, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals', projectId] });
    },
  });

  const requests: ApprovalRequest[] = data?.requests || [];
  const total = data?.total || 0;

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Approvals"
        subtitle={`${total} item${total !== 1 ? 's' : ''}`}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-brandbook-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Approval Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No approval requests</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'PENDING_APPROVAL' ? 'All caught up!' : `No ${activeTab.toLowerCase().replace('_', ' ')} requests.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <ApprovalCard
                key={r.id}
                request={r}
                canAct={canAct}
                onAct={(id, action, comment) => actMutation.mutate({ id, action, comment })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
