'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { upsellApi, adminUpsellApi, projectExtensionsApi } from '@/lib/api';
import { UpsellRecommendation } from '@/types';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { Sparkles, Plus, Star, CheckCircle2, Calendar, X, ChevronRight, Lightbulb } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'New', color: 'bg-gray-100 text-gray-500' },
  INTERESTED: { label: 'Session Requested', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Enrolled', color: 'bg-emerald-100 text-emerald-700' },
  DECLINED: { label: 'Passed', color: 'bg-gray-100 text-gray-400' },
};

interface InterestPopupProps {
  item: UpsellRecommendation;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function InterestPopup({ item, projectId, onClose, onSuccess }: InterestPopupProps) {
  const qc = useQueryClient();
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');

  const statusMutation = useMutation({
    mutationFn: (id: string) => upsellApi.updateStatus(projectId, id, 'INTERESTED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['upsell', projectId] }),
  });

  const meetingMutation = useMutation({
    mutationFn: (agenda: string) => projectExtensionsApi.requestMeeting(projectId, agenda),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = () => {
    const agenda = `[Service Interest: ${item.title}]\n\nCategory: ${item.category}\n\nPreferred Time: ${preferredTime || 'Flexible'}\n\nNotes from client:\n${notes || 'None'}`;
    // Mark interested first, then create meeting request
    statusMutation.mutate(item.id, {
      onSuccess: () => meetingMutation.mutate(agenda),
    });
  };

  const isPending = statusMutation.isPending || meetingMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brandbook-500 to-brandbook-700 p-6 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-4 w-32 h-32 bg-white/5 rounded-full" />
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Get Started</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{item.title}</h3>
            <p className="text-sm text-white/70">Schedule a free discovery call with your Project Head</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-brandbook-50 rounded-2xl p-4 border border-brandbook-100">
            <p className="text-sm text-brandbook-800 leading-relaxed">{item.description}</p>
            {item.estimatedValue && (
              <div className="flex items-center gap-2 mt-3">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-900">{formatCurrency(item.estimatedValue, item.currency)}</span>
                <span className="text-xs text-gray-400">estimated investment</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Preferred Time(s) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="e.g. Weekday mornings, next Tuesday…"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Questions or Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific questions or goals you'd like to discuss?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all resize-none"
            />
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Your Project Head will contact you within 24 hours to confirm the session.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-3.5 bg-brandbook-500 text-white font-bold rounded-2xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-lg shadow-brandbook-500/25 flex items-center justify-center gap-2"
          >
            {isPending ? 'Sending...' : (
              <>
                <Calendar className="w-4 h-4" />
                Request Discovery Session
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecommendedServicesPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [interestedItem, setInterestedItem] = useState<UpsellRecommendation | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newItem, setNewItem] = useState({
    title: '', description: '', category: 'Social Media', priority: 'MEDIUM',
    estimatedValue: 0, currency: 'USD',
  });

  const isClient = ['CLIENT_OWNER', 'CLIENT_STAFF'].includes(user?.role || '');
  const canAdd = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');

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

  const items: UpsellRecommendation[] = data?.items || [];
  const globalItems: any[] = globalData?.items || [];
  const availableGlobalItems = globalItems.filter(g => !items.some(i => i.title === g.title));

  const handleInterestSuccess = () => {
    setSuccessMessage('Your discovery session request has been submitted! Your Project Head will reach out within 24 hours.');
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/30">
      <Header
        user={user!}
        title={isClient ? 'Recommended Services' : 'Service Recommendations'}
        subtitle={isClient ? 'Growth opportunities curated for your project' : 'Manage recommendations for this client'}
        actions={
          canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brandbook-600 transition-all shadow-md shadow-brandbook-500/20"
            >
              <Plus className="w-4 h-4" /> Add Recommendation
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-8 max-w-5xl mx-auto w-full">
        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Project-specific recommendations */}
        {items.length === 0 && availableGlobalItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-brandbook-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-brandbook-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isClient ? 'No recommendations yet' : 'No recommendations added'}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {isClient
                ? 'BrandBook will add curated growth recommendations here based on your project performance.'
                : 'Add growth recommendations or service upgrades for this client.'}
            </p>
          </div>
        ) : (
          <>
            {/* Recommendation Cards */}
            {items.length > 0 && (
              <div>
                {canAdd && (
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Project Recommendations</h2>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {items.map((item) => {
                    const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS['PENDING'];
                    return (
                      <div
                        key={item.id}
                        className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                              {!isClient && (
                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold border', PRIORITY_COLORS[item.priority])}>
                                  {item.priority}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{item.category}</span>
                          </div>
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-5 leading-relaxed line-clamp-3">{item.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div>
                            {item.estimatedValue && (
                              <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-sm font-bold text-gray-800">
                                  {formatCurrency(item.estimatedValue, item.currency)}
                                </span>
                                <span className="text-xs text-gray-400">est.</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                          </div>

                          {/* Client actions — only Interested, no Decline */}
                          {isClient && item.status === 'PENDING' && (
                            <button
                              onClick={() => setInterestedItem(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-brandbook-500 text-white text-sm font-bold rounded-xl hover:bg-brandbook-600 transition-all shadow-md shadow-brandbook-500/20"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> I'm Interested
                            </button>
                          )}
                          {isClient && item.status === 'INTERESTED' && (
                            <span className="flex items-center gap-1.5 text-blue-600 text-sm font-bold">
                              <Calendar className="w-4 h-4" /> Session Requested
                            </span>
                          )}
                          {isClient && item.status === 'ACCEPTED' && (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Enrolled
                            </span>
                          )}

                          {/* Admin/PH view — can see status but not respond */}
                          {!isClient && (
                            <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold', statusInfo.color)}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Global Catalog — shown to both client and admin */}
            {availableGlobalItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-brandbook-500" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {isClient ? 'More Services Available' : 'BrandBook Global Services'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableGlobalItems.map((gItem) => (
                    <div
                      key={gItem.id}
                      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-brandbook-200 hover:shadow-md transition-all duration-300"
                    >
                      <span className="text-xs text-brandbook-600 bg-brandbook-50 px-2.5 py-0.5 rounded-full font-bold mb-3 inline-block">
                        {gItem.category}
                      </span>
                      <h3 className="font-bold text-gray-900 mb-2">{gItem.title}</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed">{gItem.description}</p>

                      {gItem.estimatedValue && (
                        <div className="text-sm font-bold text-gray-900 mb-4">
                          {formatCurrency(gItem.estimatedValue, gItem.currency)}
                          <span className="text-xs text-gray-400 font-normal ml-1">est.</span>
                        </div>
                      )}

                      {isClient ? (
                        <button
                          onClick={() => {
                            // Create a recommendation from global and immediately show interest popup
                            createMutation.mutate({
                              title: gItem.title,
                              description: gItem.description,
                              category: gItem.category,
                              priority: gItem.priority || 'MEDIUM',
                              estimatedValue: gItem.estimatedValue,
                              currency: gItem.currency || 'USD',
                              status: 'PENDING'
                            }, {
                              onSuccess: (newItem: any) => {
                                // Refresh and show interest popup for this item
                                qc.invalidateQueries({ queryKey: ['upsell', projectId] });
                                // Find the newly created item and open interest popup
                                setInterestedItem({
                                  ...gItem,
                                  id: newItem?.id || gItem.id,
                                  projectId,
                                  status: 'PENDING',
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                } as UpsellRecommendation);
                              }
                            });
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brandbook-50 text-brandbook-700 text-sm font-bold rounded-xl hover:bg-brandbook-100 transition-colors group-hover:bg-brandbook-500 group-hover:text-white"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          I'm Interested
                          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      ) : (
                        <button
                          onClick={() => createMutation.mutate({
                            title: gItem.title,
                            description: gItem.description,
                            category: gItem.category,
                            priority: gItem.priority || 'MEDIUM',
                            estimatedValue: gItem.estimatedValue,
                            currency: gItem.currency || 'USD'
                          })}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-brandbook-200 text-brandbook-600 text-xs font-bold rounded-xl hover:bg-brandbook-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to Project
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Modal — Admin/PH only */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add Recommendation</h2>
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
                      {['Social Media', 'SEO', 'Google Ads', 'Email Marketing', 'Content', 'WhatsApp', 'Analytics', 'Web Dev'].map(c => (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value</label>
                    <input type="number" value={newItem.estimatedValue}
                      onChange={(e) => setNewItem({ ...newItem, estimatedValue: +e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => createMutation.mutate(newItem)} disabled={!newItem.title || !newItem.description}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-bold rounded-xl hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  Add Recommendation
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interest Popup */}
      {interestedItem && (
        <InterestPopup
          item={interestedItem}
          projectId={projectId}
          onClose={() => setInterestedItem(null)}
          onSuccess={handleInterestSuccess}
        />
      )}
    </div>
  );
}
