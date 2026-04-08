'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { reportsApi } from '@/lib/api';
import { 
  BarChart3, TrendingUp, Users, FolderKanban, Image, 
  DollarSign, ArrowUpRight, Target, LayoutDashboard,
  Building2, Globe, Activity
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'platform' | 'staff'>('platform');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: () => reportsApi.getGlobalDashboard(),
  });

  const { data: staffStats, isLoading: isStaffLoading } = useQuery({
    queryKey: ['admin-staff-performance'],
    queryFn: () => reportsApi.getStaffPerformance(),
    enabled: activeTab === 'staff',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-auto bg-[#f8fafc]">
        <Header user={user!} title="Platform Analytics" subtitle="Loading platform data..." />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totals = stats?.totals || {
    tenants: 0, projects: 0, creatives: 0, 
    spend: 0, leads: 0, revenue: 0, conversions: 0
  };

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(totals.revenue), icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, trend: '+12.5%', color: 'from-emerald-50 to-teal-50', iconBg: 'bg-emerald-100' },
    { label: 'Total Ad Spend', value: formatCurrency(totals.spend), icon: <DollarSign className="w-5 h-5 text-blue-600" />, trend: '+8.2%', color: 'from-blue-50 to-indigo-50', iconBg: 'bg-blue-100' },
    { label: 'Total Leads', value: totals.leads.toLocaleString(), icon: <Target className="w-5 h-5 text-orange-600" />, trend: '+24.1%', color: 'from-orange-50 to-amber-50', iconBg: 'bg-orange-100' },
    { label: 'Platform ROI', value: totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) + 'x' : '0x', icon: <Activity className="w-5 h-5 text-purple-600" />, trend: '+5.4%', color: 'from-purple-50 to-fuchsia-50', iconBg: 'bg-purple-100' },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#f8fafc]">
      <Header
        user={user!}
        title="Platform Analytics"
        subtitle="Global performance across all tenants and projects"
        actions={
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('platform')}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'platform' ? "bg-white shadow-sm text-brandbook-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutDashboard className="w-4 h-4" /> Platform
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'staff' ? "bg-white shadow-sm text-brandbook-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Users className="w-4 h-4" /> Staff Performance
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {activeTab === 'platform' ? (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card, i) => (
                <div key={i} className={cn("relative overflow-hidden bg-gradient-to-br rounded-2xl border border-white/50 shadow-sm p-6 group transition-all hover:shadow-md", card.color)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2.5 rounded-xl", card.iconBg)}>
                      {card.icon}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-white/60 px-2 py-0.5 rounded-full border border-emerald-100">
                      <ArrowUpRight className="w-3 h-3" /> {card.trend}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h2>
                </div>
              ))}
            </div>

            {/* Global Reach Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Tenant Performance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Leading clients by platform utilization</p>
                  </div>
                  <button className="text-xs font-semibold text-brandbook-600 hover:text-brandbook-700">View All Tenants</button>
                </div>
                <div className="flex-1 p-0 overflow-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Projects</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Spend</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats?.tenants?.map((tenant: any) => (
                        <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                {tenant.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{tenant.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-600">{tenant.projectsCount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(tenant.totalSpend)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 ml-auto overflow-hidden">
                              <div 
                                className="bg-brandbook-500 h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (tenant.totalSpend / (totals.spend || 1)) * 100 * 5)}%` }} 
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-6">Object Distribution</h3>
                <div className="space-y-6 flex-1">
                  {[
                    { label: 'Active Tenants', value: totals.tenants, icon: <Building2 className="w-4 h-4" />, color: 'bg-blue-500', max: 100 },
                    { label: 'Workspaces (Projects)', value: totals.projects, icon: <FolderKanban className="w-4 h-4" />, color: 'bg-purple-500', max: 500 },
                    { label: 'Creative Assets', value: totals.creatives, icon: <Image className="w-4 h-4" />, color: 'bg-emerald-500', max: 5000 },
                    { label: 'Total Conversions', value: totals.conversions, icon: <Globe className="w-4 h-4" />, color: 'bg-orange-500', max: 10000 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <div className={cn("p-1.5 rounded-lg text-white", item.color)}>
                            {item.icon}
                          </div>
                          {item.label}
                        </div>
                        <span className="font-bold text-gray-900">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000", item.color)} 
                          style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">System Integrity</p>
                  <div className="flex justify-center gap-1.5">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className={cn("w-1.5 h-6 rounded-full transition-all", i < 9 ? "bg-emerald-400" : "bg-gray-100")} />
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-500 font-bold mt-3">All Systems Operational</p>
                </div>
              </div>
            </div>

            {/* Project Statistics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4">Top Project Workspaces</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {stats?.projects?.map((project: any) => (
                  <div key={project.id} className="p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-100 transition-all group">
                    <p className="text-[10px] font-bold text-brandbook-500 uppercase tracking-tighter mb-1">{project.tenantName}</p>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-brandbook-600 truncate">{project.name}</h4>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Image className="w-3.5 h-3.5" />
                      <span><strong className="text-gray-700">{project.creativesCount}</strong> assets</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Staff Performance View */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Internal Staff Performance</h3>
              <p className="text-xs text-gray-500 mt-0.5">Efficiency, revision rates, and creative output volume</p>
            </div>
            {isStaffLoading ? (
              <div className="p-12 text-center text-gray-400">Loading performance data...</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Staff Member</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Creatives</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Approved</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Revisions</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Revision Rate</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Efficiency Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staffStats?.map((staff: any) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brandbook-100 text-brandbook-600 flex items-center justify-center font-bold text-xs uppercase">
                              {staff.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase">{staff.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">{staff.creativesCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-emerald-600">{staff.approvedCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-amber-600">{staff.totalRevisions}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "text-xs px-2 py-0.5 rounded-full font-bold",
                               staff.revisionRate < 1 ? "bg-emerald-50 text-emerald-600" :
                               staff.revisionRate < 2 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                             )}>
                               {staff.revisionRate}
                             </span>
                             <span className="text-[10px] text-gray-400">per asset</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                             <TrendingUp className="w-3.5 h-3.5 text-brandbook-500" />
                             <span className="text-sm font-bold text-gray-900">
                               {Math.max(0, 100 - (staff.revisionRate * 20)).toFixed(0)}%
                             </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
