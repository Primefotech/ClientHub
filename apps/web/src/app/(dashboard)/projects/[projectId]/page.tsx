'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { projectsApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/utils';
import {
  CheckCircle2, Clock, Users2, BarChart3, TrendingUp,
  AlertTriangle, Image, Calendar, MessageSquare, ArrowUpRight,
  ExternalLink, Download, LayoutDashboard, Share2, Cpu, FileText, Link2, LifeBuoy, History, Plus, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { canAccessModule } from '@/lib/auth';
import { MilestoneTracker } from '@/components/projects/MilestoneTracker';
import { ProjectManagerCard } from '@/components/projects/ProjectManagerCard';
import { projectExtensionsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function MetricCard({ label, value, icon, href, sub }: {
  label: string; value: string | number; icon: React.ReactNode; href?: string; sub?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-brandbook-50 flex items-center justify-center">
          {icon}
        </div>
        {href && <ArrowUpRight className="w-4 h-4 text-gray-300" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function ProjectDashboard({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  const { data: stats } = useQuery({
    queryKey: ['project-dashboard', projectId],
    queryFn: () => projectsApi.getDashboard(projectId),
  });

  const qc = useQueryClient();
  const [showMeetingRequest, setShowMeetingRequest] = useState(false);
  const [meetingAgenda, setMeetingAgenda] = useState('');

  const meetingMutation = useMutation({
    mutationFn: (agenda: string) => projectExtensionsApi.requestMeeting(projectId, agenda),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-dashboard', projectId] });
      setShowMeetingRequest(false);
      setMeetingAgenda('');
      alert('Meeting request sent successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to request meeting');
    }
  });

  const hasWebDev = canAccessModule(user, 'webdev', projectId, project);
  const hasCRM = canAccessModule(user, 'crm', projectId, project);
  const hasReports = canAccessModule(user, 'reports', projectId, project);
  const hasCalendar = canAccessModule(user, 'calendar', projectId, project);

  const canSeeFinancials = ['SUPER_ADMIN', 'PROJECT_HEAD', 'CLIENT_OWNER'].includes(user?.role || '');

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title={project?.name || 'Project Dashboard'}
        subtitle={project?.tenant?.name}
      />

      <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Tracking & Management Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MilestoneTracker milestones={(project?.milestones as any) || []} />
          </div>
          <div>
            <ProjectManagerCard 
              manager={project?.projectManager} 
              schedulingUrl={project?.settings?.schedulingUrl} 
            />
          </div>
        </div>

        {/* Handover & Brand Assets (Visible only if handover is complete) */}
        {project?.isHandoverComplete && (
          <div className="bg-gradient-to-r from-brandbook-600 to-brandbook-800 rounded-3xl p-8 text-white shadow-2xl shadow-brandbook-500/20 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Share2 className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">Final Delivery Ready</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">Your Brand Assets Hub</h3>
              <p className="text-brandbook-100 mt-2 max-w-xl text-sm leading-relaxed">
                Project handover is complete! All final delivery artifacts, style guides, and master assets have been consolidated in your private secure drive.
              </p>
            </div>
            
            {project.brandAssetsUrl ? (
              <a 
                href={project.brandAssetsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 flex items-center gap-3 bg-white text-brandbook-700 px-8 py-4 rounded-2xl font-bold hover:bg-brandbook-50 transition-all shadow-xl hover:scale-105 active:scale-95 group/btn"
              >
                <Download className="w-5 h-5 group-hover/btn:animate-bounce" />
                Access My Drive
                <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
              </a>
            ) : (
              <div className="relative z-10 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white/50 text-sm font-medium italic">
                Link being prepared by PM...
              </div>
            )}
          </div>
        )}

        {/* Web Dev & Design Center (Special Flow) */}
        {hasWebDev && (project?.figmaLink || project?.stagingLink) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between group hover:border-brandbook-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Design Prototype</h4>
                  <p className="text-sm text-gray-500">Live Figma review for UI/UX approvals</p>
                </div>
              </div>
              {project.figmaLink ? (
                <a href={project.figmaLink} target="_blank" rel="noopener noreferrer" className="bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 p-3 rounded-xl transition-all">
                  <ExternalLink className="w-5 h-5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">Coming soon</span>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between group hover:border-brandbook-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Live Preview</h4>
                  <p className="text-sm text-gray-500">View progress on staging server</p>
                </div>
              </div>
              {project.stagingLink ? (
                <a href={project.stagingLink} target="_blank" rel="noopener noreferrer" className="bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 p-3 rounded-xl transition-all">
                  <ExternalLink className="w-5 h-5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">Coming soon</span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Action Controls */}
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowMeetingRequest(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-bold text-gray-700 hover:border-brandbook-300 hover:bg-brandbook-50 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-brandbook-500" />
            Request Strategy Call
            {stats && (
              <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {stats.pendingMeetings || 0} pending
              </span>
            )}
          </button>

          {project?.proposalUrl && (
            <a 
              href={project.proposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-2xl text-sm font-bold text-gray-700 hover:border-brandbook-300 hover:bg-brandbook-50 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              View Project Scope
            </a>
          )}

          {project?.supportSystemActive && (
            <button className="flex items-center gap-2 bg-brandbook-600 text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-brandbook-700 transition-all shadow-md shadow-brandbook-500/20">
              <LifeBuoy className="w-4 h-4" />
              Open Support Ticket
            </button>
          )}
        </div>

        {/* Meeting Request Modal */}
        {showMeetingRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brandbook-50 flex items-center justify-center text-brandbook-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Request Meeting</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Your PM will be notified. Please provide a brief agenda.</p>
              
              <textarea 
                value={meetingAgenda}
                onChange={(e) => setMeetingAgenda(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all resize-none mb-6"
                placeholder="Discuss UI/UX revisions for the landing page..."
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => meetingMutation.mutate(meetingAgenda)}
                  disabled={!meetingAgenda || meetingMutation.isPending}
                  className="flex-1 py-3.5 bg-brandbook-500 text-white font-bold rounded-2xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-lg shadow-brandbook-500/30"
                >
                  {meetingMutation.isPending ? 'Sending...' : 'Send Request'}
                </button>
                <button 
                  onClick={() => setShowMeetingRequest(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics grid gated by Service */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Pending Approvals"
            value={stats?.pendingApprovals ?? '—'}
            icon={<Clock className="w-5 h-5 text-yellow-500" />}
            href={`/projects/${projectId}/approvals?status=PENDING_APPROVAL`}
          />
          <MetricCard
            label="Total Creatives"
            value={stats?.totalCreatives ?? '—'}
            icon={<Image className="w-5 h-5 text-blue-500" />}
            href={`/projects/${projectId}/creatives`}
          />
          {hasCRM ? (
            <MetricCard
              label="CRM Leads"
              value={stats?.recentLeads ?? '—'}
              icon={<Users2 className="w-5 h-5 text-purple-500" />}
              href={`/projects/${projectId}/crm`}
            />
          ) : (
            <div className="bg-gray-50/50 rounded-xl border border-gray-100 border-dashed p-5 flex flex-col justify-center opacity-50">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-400">CRM Locked</p>
              <p className="text-[10px] text-gray-400">Upgrade to Lead Gen tier</p>
            </div>
          )}
          {hasCalendar ? (
            <MetricCard
              label="Upcoming Events"
              value={stats?.upcomingEvents ?? '—'}
              icon={<Calendar className="w-5 h-5 text-green-500" />}
              href={`/projects/${projectId}/calendar`}
            />
          ) : (
            <div className="bg-gray-50/50 rounded-xl border border-gray-100 border-dashed p-5 flex flex-col justify-center opacity-50">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-400">Calendar Locked</p>
              <p className="text-[10px] text-gray-400">Module not in package</p>
            </div>
          )}
        </div>

        {/* Ad Performance (gated by Service + Role) */}
        {canSeeFinancials && hasReports && stats && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ad Performance Overview</h2>
              <Link
                href={`/projects/${projectId}/reports`}
                className="text-sm text-brandbook-600 hover:underline flex items-center gap-1"
              >
                View Reports <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Spend', value: formatCurrency(stats.totalSpend), icon: '💰' },
                { label: 'Leads Generated', value: formatNumber(stats.totalLeads), icon: '🎯' },
                { label: 'Conversions', value: formatNumber(stats.totalConversions), icon: '✅' },
                { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: '📈' },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl mb-1">{m.icon}</p>
                  <p className="text-lg font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {/* Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats.recentActivity.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-brandbook-50 flex items-center justify-center flex-shrink-0">
                      {log.user?.avatar ? (
                        <img src={log.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <span className="text-xs font-bold text-brandbook-600">
                          {log.user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{log.user?.name}</span>{' '}
                        <span className="text-gray-500">{log.action.toLowerCase().replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revisions History (Always visible if exists) */}
          {hasWebDev && project?.revisionRequests && project.revisionRequests.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-brandbook-500" />
                  Revision History
                </h2>
                <span className="text-xs text-gray-400 font-bold">
                  {project.revisionCount} / {project.maxRevisions} Used
                </span>
              </div>
              <div className="space-y-4">
                {project.revisionRequests.map((rev: any) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-bold text-brandbook-600">{rev.requestedBy}</p>
                      <p className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">{rev.description}</p>
                    {rev.documents?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rev.documents.map((doc: string, idx: number) => (
                          <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-500 hover:text-brandbook-600 transition-all">
                            <Download className="w-2.5 h-2.5" /> Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
