'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { reportsApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, Users2, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = ['meta', 'google', 'tiktok', 'manual'];
const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877f2', google: '#ea4335', tiktok: '#000', manual: '#6366f1',
};

function KPICard({ label, value, icon, sub, trend }: {
  label: string; value: string; icon: React.ReactNode; sub?: string; trend?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-brandbook-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-medium flex items-center gap-0.5', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [newReport, setNewReport] = useState({
    platform: 'meta', campaignName: '', dateFrom: '', dateTo: '',
    spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0,
  });

  const canAdd = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');

  const { data: aggregated } = useQuery({
    queryKey: ['reports-agg', projectId, dateFrom, dateTo],
    queryFn: () => reportsApi.getAggregated(projectId, { dateFrom, dateTo }),
  });

  const { data: timeSeries } = useQuery({
    queryKey: ['reports-ts', projectId, dateFrom, dateTo],
    queryFn: () => reportsApi.getTimeSeries(projectId, dateFrom, dateTo),
  });

  const addMutation = useMutation({
    mutationFn: (dto: any) => reportsApi.create(projectId, { ...dto, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports-agg', projectId] });
      setShowAdd(false);
    },
  });

  const totals = aggregated?.totals || {};
  const byPlatform = aggregated?.byPlatform || [];
  const series = Array.isArray(timeSeries) ? timeSeries : [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Ad Reports"
        subtitle="Performance analytics"
        actions={
          canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Report
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Date Range */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400" />
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input type="date" value={dateTo} readOnly
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Spend" value={formatCurrency(totals.spend || 0)} icon={<DollarSign className="w-5 h-5 text-brandbook-600" />} />
          <KPICard label="Leads Generated" value={formatNumber(totals.leads || 0)} icon={<Users2 className="w-5 h-5 text-purple-500" />}
            sub={totals.cpl ? `CPL: ${formatCurrency(totals.cpl)}` : undefined} />
          <KPICard label="Conversions" value={formatNumber(totals.conversions || 0)} icon={<Target className="w-5 h-5 text-green-500" />} />
          <KPICard label="ROAS" value={totals.roas ? `${totals.roas.toFixed(2)}x` : '—'} icon={<Zap className="w-5 h-5 text-yellow-500" />}
            sub={totals.revenue ? `Revenue: ${formatCurrency(totals.revenue)}` : undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend Over Time */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Spend & Leads Over Time</h3>
            {series.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dateFrom" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} dot={false} name="Spend ($)" />
                  <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} dot={false} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Platform */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">By Platform</h3>
            {byPlatform.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <div className="space-y-3">
                {byPlatform.map((p: any) => (
                  <div key={p.platform}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{p.platform}</span>
                      <span className="text-gray-500">{formatCurrency(p.spend)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: byPlatform.length > 0 ? `${(p.spend / Math.max(...byPlatform.map((x: any) => x.spend))) * 100}%` : '0%',
                          backgroundColor: PLATFORM_COLORS[p.platform] || '#6366f1',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{p.leads} leads · {p.conversions} conversions</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Report Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Ad Report</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select value={newReport.platform} onChange={(e) => setNewReport({ ...newReport, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input value={newReport.campaignName} onChange={(e) => setNewReport({ ...newReport, campaignName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input type="date" value={newReport.dateFrom} onChange={(e) => setNewReport({ ...newReport, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input type="date" value={newReport.dateTo} onChange={(e) => setNewReport({ ...newReport, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                {[
                  { key: 'spend', label: 'Spend ($)' },
                  { key: 'impressions', label: 'Impressions' },
                  { key: 'clicks', label: 'Clicks' },
                  { key: 'leads', label: 'Leads' },
                  { key: 'conversions', label: 'Conversions' },
                  { key: 'revenue', label: 'Revenue ($)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="number" value={(newReport as any)[key]}
                      onChange={(e) => setNewReport({ ...newReport, [key]: +e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => addMutation.mutate(newReport)} disabled={addMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  {addMutation.isPending ? 'Saving...' : 'Save Report'}
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
