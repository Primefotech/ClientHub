'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { crmApi } from '@/lib/api';
import { CRMLead, LeadStatus } from '@/types';
import { LEAD_STATUS_COLORS, formatRelativeTime, formatCurrency, cn } from '@/lib/utils';
import {
  Plus, Search, Filter, ChevronDown, User2,
  Phone, Mail, Building2, Tag, TrendingUp,
} from 'lucide-react';

const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD'];

function LeadRow({ lead, canEdit, onStatusChange }: {
  lead: CRMLead;
  canEdit: boolean;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const [editingStatus, setEditingStatus] = useState(false);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User2 className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
            {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          {lead.email && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> {lead.email}
            </p>
          )}
          {lead.phone && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.phone}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <div className="relative">
            <button
              onClick={() => setEditingStatus(!editingStatus)}
              className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1', LEAD_STATUS_COLORS[lead.status])}
            >
              {lead.status}
              <ChevronDown className="w-3 h-3" />
            </button>
            {editingStatus && (
              <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-40">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(lead.id, s); setEditingStatus(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className={cn('w-2 h-2 rounded-full', LEAD_STATUS_COLORS[s].split(' ')[0])} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', LEAD_STATUS_COLORS[lead.status])}>
            {lead.status}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {lead.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brandbook-100 flex items-center justify-center">
              <span className="text-xs font-bold text-brandbook-600">
                {lead.assignedTo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
            <span className="text-sm text-gray-600">{lead.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{lead.source}</span>
          {lead.tags?.length > 0 && (
            <span className="text-xs text-gray-400">+{lead.tags.length} tags</span>
          )}
        </div>
      </td>
      {lead.value && (
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900">{formatCurrency(lead.value, lead.currency)}</p>
        </td>
      )}
      <td className="px-4 py-3 text-xs text-gray-400">
        {formatRelativeTime(lead.createdAt)}
      </td>
    </tr>
  );
}

export default function CRMPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  const canAddLead = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');
  const canEditStatus = user?.role !== 'CLIENT_OWNER';

  const { data, isLoading } = useQuery({
    queryKey: ['crm', projectId, search, statusFilter],
    queryFn: () => crmApi.list(projectId, {
      search: search || undefined,
      status: statusFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['crm-stats', projectId],
    queryFn: () => crmApi.getStats(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      crmApi.update(projectId, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', projectId] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => crmApi.create(projectId, { ...data, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', projectId] });
      setShowAddLead(false);
      setNewLead({ name: '', email: '', phone: '', company: '', notes: '' });
    },
  });

  const leads: CRMLead[] = data?.leads || [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="CRM"
        subtitle={`${data?.total || 0} leads`}
        actions={
          canAddLead && (
            <button
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Leads</p>
            </div>
            {stats.byStatus?.slice(0, 3).map((s: any) => (
              <div key={s.status} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <p className="text-sm text-gray-500">{s.status}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 bg-white"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No leads found</p>
              <p className="text-sm text-gray-400 mt-1">
                {canAddLead ? 'Add your first lead or wait for webhook data.' : 'No leads assigned to you yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Lead', 'Contact', 'Status', 'Assigned To', 'Source', 'Value', 'Added'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      canEdit={canEditStatus}
                      onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Lead Modal */}
        {showAddLead && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Lead</h2>
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Full Name *', placeholder: 'John Doe', required: true },
                  { key: 'email', label: 'Email', placeholder: 'john@example.com' },
                  { key: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
                  { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      value={(newLead as any)[key]}
                      onChange={(e) => setNewLead({ ...newLead, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => createMutation.mutate(newLead)}
                  disabled={!newLead.name || createMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Lead'}
                </button>
                <button
                  onClick={() => setShowAddLead(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
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
