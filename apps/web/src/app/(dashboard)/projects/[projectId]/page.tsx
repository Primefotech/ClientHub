'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { projectsApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/utils';
import {
  CheckCircle2, Clock, Users2, BarChart3, TrendingUp,
  AlertTriangle, Image, Calendar, MessageSquare, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

  const canSeeFinancials = ['SUPER_ADMIN', 'PROJECT_HEAD', 'CLIENT_OWNER'].includes(user?.role || '');

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title={project?.name || 'Project Dashboard'}
        subtitle={project?.tenant?.name}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Key Metrics */}
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
          <MetricCard
            label="CRM Leads"
            value={stats?.recentLeads ?? '—'}
            icon={<Users2 className="w-5 h-5 text-purple-500" />}
            href={`/projects/${projectId}/crm`}
          />
          <MetricCard
            label="Upcoming Events"
            value={stats?.upcomingEvents ?? '—'}
            icon={<Calendar className="w-5 h-5 text-green-500" />}
            href={`/projects/${projectId}/calendar`}
          />
        </div>

        {/* Ad Performance (visible to PH, Client Owner, Admin) */}
        {canSeeFinancials && stats && (
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
      </div>
    </div>
  );
}
