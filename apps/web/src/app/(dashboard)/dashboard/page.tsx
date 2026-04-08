'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { projectsApi, tenantsApi } from '@/lib/api';
import { formatRelativeTime, formatCurrency, formatNumber } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import {
  Building2, FolderKanban, Users, TrendingUp, ArrowRight,
  Clock, CheckCircle2, AlertCircle, Plus,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function StatCard({ label, value, icon, color, trend }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: !!user,
  });

  const { data: tenantStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const tenants = await tenantsApi.list({ limit: 5 });
      return tenants;
    },
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title={`Good morning, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`${ROLE_LABELS[user?.role || '']} — BrandBook Client OS`}
        actions={
          isSuperAdmin ? (
            <Link
              href="/admin/tenants"
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tenant
            </Link>
          ) : null
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Tenants"
              value={tenantStats?.total || 0}
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <StatCard
              label="Total Projects"
              value={projectList.length}
              icon={<FolderKanban className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50"
            />
            <StatCard
              label="Active Users"
              value="—"
              icon={<Users className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
            />
            <StatCard
              label="Revenue Tracked"
              value="—"
              icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
              color="bg-orange-50"
            />
          </div>
        )}

        {/* Projects Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              {isSuperAdmin ? 'All Projects' : 'My Projects'}
            </h2>
            {isSuperAdmin && (
              <Link
                href="/admin/tenants"
                className="text-sm text-brandbook-600 hover:underline flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {projectList.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {isSuperAdmin ? 'Create a tenant and assign projects to get started.' : 'You have not been assigned to any projects.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectList.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brandbook-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: project.color ? `${project.color}20` : '#e0e7ff' }}
                      >
                        {project.icon || '📁'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-brandbook-600 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500">{project.tenant?.name}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    )}>
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {project._count?.creatives !== undefined && (
                      <span>{project._count.creatives} creatives</span>
                    )}
                    {project._count?.crmLeads !== undefined && (
                      <span>{project._count.crmLeads} leads</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
