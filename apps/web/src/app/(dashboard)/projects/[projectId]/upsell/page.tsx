'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { upsellApi, adminUpsellApi } from '@/lib/api';
import { UpsellRecommendation } from '@/types';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { TrendingUp, Plus, Star, CheckCircle2, XCircle, Eye } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

const STATUS_COLORS_UPSELL: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  INTERESTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-600',
};

export default function UpsellPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '', description: '', category: 'Social Media', priority: 'MEDIUM',
    estimatedValue: 0, currency: 'USD',
  });

  const canAdd = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');
  const canRespond = ['CLIENT_OWNER'].includes(user?.role || '');

  const { data } = useQuery({
    queryKey: ['upsell', projectId],
    queryFn: () => upsellApi.list(projectId),
  });

  const { data: globalData } = useQuery({
    queryKey: ['global-upsells'],
    queryFn: () => adminUpsellApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => upsellApi.create(projectId, { ...dto, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsell', projectId] });
      setShowAdd(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      upsellApi.updateStatus(projectId, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['upsell', projectId] }),
  });

  const items: UpsellRecommendation[] = data?.items || [];
  const globalItems: any[] = globalData?.items || [];
  // Filter out global items that already exist in the project (by title)
  const availableGlobalItems = globalItems.filter(g => !items.some(i => i.title === g.title));

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Upsell Recommendations"
        subtitle={canAdd ? 'Recommendations for this client' : 'Growth opportunities from BrandBook'}
        actions={
          canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Recommendation
            </button>
          )
        }
      />

      <div className="flex-1 p-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recommendations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {canAdd
                ? 'Add growth recommendations for your client.'
                : 'BrandBook will add recommendations here when available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLORS[item.priority])}>
                        {item.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0', STATUS_COLORS_UPSELL[item.status])}>
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.description}</p>

                <div className="flex items-center justify-between">
                  <div>
                    {item.estimatedValue && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.estimatedValue, item.currency)}
                        </span>
                        <span className="text-xs text-gray-400">est. value</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(item.createdAt)}
                      {item.createdBy && ` · by ${item.createdBy.name}`}
                    </p>
                  </div>

                  {canRespond && item.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => statusMutation.mutate({ id: item.id, status: 'INTERESTED' })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Interested
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: item.id, status: 'DECLINED' })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                  {canRespond && item.status === 'INTERESTED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: item.id, status: 'ACCEPTED' })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Catalog Section (Only if items exist) */}
        {availableGlobalItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-brandbook-500" />
              BrandBook Global Services
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {availableGlobalItems.map((gItem) => (
                <div key={gItem.id} className="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:bg-white transition-colors">
                   <div className="mb-2">
                     <span className="text-xs text-brandbook-500 bg-brandbook-50 px-2 py-0.5 rounded font-medium mb-2 inline-block">{gItem.category}</span>
                     <h3 className="font-medium text-gray-900">{gItem.title}</h3>
                   </div>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-3">{gItem.description}</p>
                   {gItem.estimatedValue && (
                      <div className="text-sm font-semibold text-gray-900 mb-4">
                        {formatCurrency(gItem.estimatedValue, gItem.currency)}
                      </div>
                   )}
                   
                   {canRespond ? (
                     <button
                        onClick={() => {
                          createMutation.mutate({
                            title: gItem.title,
                            description: gItem.description,
                            category: gItem.category,
                            priority: gItem.priority || 'MEDIUM',
                            estimatedValue: gItem.estimatedValue,
                            currency: gItem.currency || 'USD',
                            status: 'INTERESTED'
                          });
                          alert('Great! Project Head has been notified of your interest.');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Mark as Interested
                      </button>
                   ) : canAdd ? (
                      <button
                        onClick={() => createMutation.mutate({
                          title: gItem.title,
                          description: gItem.description,
                          category: gItem.category,
                          priority: gItem.priority || 'MEDIUM',
                          estimatedValue: gItem.estimatedValue,
                          currency: gItem.currency || 'USD'
                        })}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-brandbook-200 text-brandbook-600 text-xs font-semibold rounded-lg hover:bg-brandbook-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Project
                      </button>
                   ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Recommendation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    placeholder="e.g. Add Google Ads to expand reach" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="Describe the recommendation and its benefits..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                      {['Social Media', 'SEO', 'Google Ads', 'Email Marketing', 'Content', 'WhatsApp', 'Analytics'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                      {['HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
                    <input type="number" value={newItem.estimatedValue}
                      onChange={(e) => setNewItem({ ...newItem, estimatedValue: +e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => createMutation.mutate(newItem)} disabled={!newItem.title || !newItem.description}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  Add
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
