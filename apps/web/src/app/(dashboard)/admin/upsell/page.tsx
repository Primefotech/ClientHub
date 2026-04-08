'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { adminUpsellApi } from '@/lib/api';
import { TrendingUp, Plus, Trash2, Edit } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function AdminUpsellPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUpsell, setNewUpsell] = useState({
    title: '', description: '', category: 'Design', estimatedValue: '', currency: 'USD'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['global-upsells'],
    queryFn: () => adminUpsellApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => adminUpsellApi.create({
      ...dto,
      estimatedValue: dto.estimatedValue ? parseFloat(dto.estimatedValue) : undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-upsells'] });
      setShowCreate(false);
      setNewUpsell({ title: '', description: '', category: 'Design', estimatedValue: '', currency: 'USD' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUpsellApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['global-upsells'] }),
  });

  const upsells = data?.items || [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Global Upsell Services"
        subtitle="Manage master upsell templates for all projects"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading catalog...</div>
          ) : upsells.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No master upsell services yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Service', 'Category', 'Est. Value', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upsells.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{u.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-sm">{u.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                        {u.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {u.estimatedValue ? formatCurrency(u.estimatedValue, u.currency) : 'Custom'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this global service?')) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Global Upsell Service</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={newUpsell.title}
                  onChange={(e) => setNewUpsell({ ...newUpsell, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  placeholder="e.g. SEO Optimization Package"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newUpsell.description}
                  onChange={(e) => setNewUpsell({ ...newUpsell, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newUpsell.category}
                    onChange={(e) => setNewUpsell({ ...newUpsell, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    {['Design', 'Development', 'Marketing', 'Content', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newUpsell.currency}
                    onChange={(e) => setNewUpsell({ ...newUpsell, currency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    {['USD', 'EUR', 'GBP', 'INR'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                <input
                  type="number"
                  value={newUpsell.estimatedValue}
                  onChange={(e) => setNewUpsell({ ...newUpsell, estimatedValue: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => createMutation.mutate(newUpsell)}
                disabled={!newUpsell.title || !newUpsell.description || createMutation.isPending}
                className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Saving...' : 'Add Service'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
