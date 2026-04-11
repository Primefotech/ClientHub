'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { Settings, Zap, Users, Lock, Unlock, Shield, Plus, Trash2, ExternalLink, Download, CheckCircle2, Clock, Briefcase, Globe, Cpu, FileText, Key, GraduationCap, Link2, LifeBuoy } from 'lucide-react';
import { servicesApi, projectsApi, approvalsApi, ruleEngineApi, usersApi, projectExtensionsApi } from '@/lib/api';
import { ApprovalRule } from '@/types';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'webdev', label: 'Web Dev', icon: Cpu },
  { id: 'handover', label: 'Handover & SLA', icon: ExternalLink },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'approvals', label: 'Approval Rules', icon: Shield },
  { id: 'rules', label: 'Rule Engine', icon: Zap },
];

export default function ProjectSettingsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const canManage = ['SUPER_ADMIN', 'PROJECT_HEAD'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState('general');
  const [editingUser, setEditingUser] = useState<any>(null);

  // ── Per-tab local form state (initialized from project once loaded)
  const [generalForm, setGeneralForm] = useState<any>(null);
  const [webdevForm, setWebdevForm] = useState<any>(null);
  const [handoverForm, setHandoverForm] = useState<any>(null);

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.list({ roles: ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'] }),
    enabled: activeTab === 'general' || activeTab === 'team',
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
    enabled: activeTab === 'general',
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  const { data: rules } = useQuery({
    queryKey: ['approval-rules', projectId],
    queryFn: () => approvalsApi.getRules(projectId),
    enabled: activeTab === 'approvals',
  });

  const { data: ruleConfigs } = useQuery({
    queryKey: ['rule-configs', projectId],
    queryFn: () => ruleEngineApi.getAllConfigs(projectId),
    enabled: activeTab === 'rules',
  });

  // ── Initialize form state when project loads
  useEffect(() => {
    if (project && !generalForm) {
      setGeneralForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        color: project.color || '#6366f1',
        projectManagerId: project.projectManagerId || '',
        brandAssetsUrl: project.brandAssetsUrl || '',
        isHandoverComplete: project.isHandoverComplete || false,
        serviceId: project.serviceId || '',
        proposalUrl: project.proposalUrl || '',
        maxRevisions: project.maxRevisions || 3,
      });
    }
    if (project && !webdevForm) {
      setWebdevForm({
        figmaLink: project.figmaLink || '',
        stagingLink: project.stagingLink || '',
        maxRevisions: project.maxRevisions || 3,
      });
    }
    if (project && !handoverForm) {
      setHandoverForm({
        handoverCredentials: project.handoverCredentials || '',
        trainingScheduledAt: project.trainingScheduledAt
          ? new Date(project.trainingScheduledAt).toISOString().slice(0, 16)
          : '',
        hasSLA: project.hasSLA || false,
        slaType: project.slaType || '',
        slaDocumentUrl: project.slaDocumentUrl || '',
        supportSystemActive: project.supportSystemActive || false,
      });
    }
  }, [project]);

  // ── Mutations
  const lockRuleMutation = useMutation({
    mutationFn: (ruleId: string) => approvalsApi.lockRule(projectId, ruleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-rules', projectId] }),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { userId: string, role: string, permissions: any }) =>
      usersApi.assignProject(data.userId, { projectId, role: data.role, permissions: data.permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      setEditingUser(null);
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  const createRevisionMutation = useMutation({
    mutationFn: (description: string) => projectExtensionsApi.createRevision(projectId, { description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      setWebdevForm({ ...webdevForm, showRevForm: false, revDesc: '' });
    }
  });

  const toggleMilestone = (milestoneId: string) => {
    if (!project?.milestones) return;
    const newMilestones = project.milestones.map((m: any) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: m.status === 'completed' ? 'pending' : 'completed',
          updatedAt: new Date().toISOString(),
          updatedBy: user?.name
        };
      }
      return m;
    });
    updateProjectMutation.mutate({ milestones: newMilestones });
  };

  const ruleList: ApprovalRule[] = Array.isArray(rules) ? rules : [];
  const configs = Array.isArray(ruleConfigs) ? ruleConfigs : [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header user={user!} title="Project Settings" />

      <div className="flex-1 p-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-brandbook-50 text-brandbook-700'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ───────────────── GENERAL TAB ───────────────── */}
            {activeTab === 'general' && generalForm && project && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                      value={generalForm.name}
                      disabled={!canManage}
                      onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={generalForm.description}
                      disabled={!canManage}
                      onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none disabled:bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={generalForm.status}
                        disabled={!canManage}
                        onChange={(e) => setGeneralForm({ ...generalForm, status: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      >
                        <option>ACTIVE</option>
                        <option>PAUSED</option>
                        <option>COMPLETED</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
                      <select
                        value={generalForm.projectManagerId}
                        disabled={!canManage}
                        onChange={(e) => setGeneralForm({ ...generalForm, projectManagerId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Manager</option>
                        {staff?.users?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={generalForm.color}
                        disabled={!canManage}
                        onChange={(e) => setGeneralForm({ ...generalForm, color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Handover quick fields */}
                  <div className="pt-4 border-t border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Project Handover</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Assets URL (Drive Link)</label>
                        <input
                          value={generalForm.brandAssetsUrl}
                          disabled={!canManage}
                          placeholder="https://drive.google.com/..."
                          onChange={(e) => setGeneralForm({ ...generalForm, brandAssetsUrl: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            className={cn(
                              "w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer",
                              generalForm.isHandoverComplete ? "bg-brandbook-500" : "bg-gray-200"
                            )}
                            onClick={() => {
                              if (!canManage) return;
                              const newVal = !generalForm.isHandoverComplete;
                              setGeneralForm({ ...generalForm, isHandoverComplete: newVal });
                            }}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full transition-transform duration-200",
                              generalForm.isHandoverComplete ? "translate-x-4" : "translate-x-0"
                            )} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Handover Complete</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="pt-4 border-t border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Service Tier & Scope</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Service</label>
                        <select
                          value={generalForm.serviceId}
                          disabled={!canManage}
                          onChange={(e) => setGeneralForm({ ...generalForm, serviceId: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Service Package</option>
                          {(services || []).map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proposal URL</label>
                        <input
                          value={generalForm.proposalUrl}
                          disabled={!canManage}
                          placeholder="https://link-to-proposal.pdf"
                          onChange={(e) => setGeneralForm({ ...generalForm, proposalUrl: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="pt-4 border-t border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Milestone Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {project.milestones?.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => toggleMilestone(m.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                            m.status === 'completed'
                              ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                              : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"
                          )}
                        >
                          <span className="text-xs font-bold">{m.label}</span>
                          {m.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => updateProjectMutation.mutate(generalForm)}
                      disabled={updateProjectMutation.isPending}
                      className="mt-4 px-6 py-2.5 bg-brandbook-500 text-white text-sm font-bold rounded-xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-md shadow-brandbook-500/20"
                    >
                      {updateProjectMutation.isPending ? 'Saving…' : 'Save General Settings'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ───────────────── WEB DEV TAB ───────────────── */}
            {activeTab === 'webdev' && webdevForm && project && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-brandbook-500" />
                  Web Design & Development Settings
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Figma Design Link</label>
                      <input
                        value={webdevForm.figmaLink}
                        disabled={!canManage}
                        placeholder="https://figma.com/file/..."
                        onChange={(e) => setWebdevForm({ ...webdevForm, figmaLink: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Staging / Preview Link</label>
                      <input
                        value={webdevForm.stagingLink}
                        disabled={!canManage}
                        placeholder="https://staging.domain.com"
                        onChange={(e) => setWebdevForm({ ...webdevForm, stagingLink: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UI/UX Approval Status</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateProjectMutation.mutate({ uiUxApprovedAt: project.uiUxApprovedAt ? null : new Date() })}
                          className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2",
                            project.uiUxApprovedAt ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {project.uiUxApprovedAt ? 'Approved' : 'Mark UI/UX Approved'}
                        </button>
                        {project.uiUxApprovedAt && (
                          <span className="text-xs text-gray-400">On {new Date(project.uiUxApprovedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content Approval Status</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateProjectMutation.mutate({ contentApprovedAt: project.contentApprovedAt ? null : new Date() })}
                          className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2",
                            project.contentApprovedAt ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {project.contentApprovedAt ? 'Approved' : 'Mark Content Approved'}
                        </button>
                        {project.contentApprovedAt && (
                          <span className="text-xs text-gray-400">On {new Date(project.contentApprovedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Revision Management */}
                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Revision Management</h3>
                      <button
                        onClick={() => setWebdevForm({ ...webdevForm, showRevForm: true })}
                        className="text-xs font-bold text-brandbook-600 hover:text-brandbook-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Submit New Revision
                      </button>
                    </div>

                    {webdevForm.showRevForm && (
                      <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex flex-col gap-3">
                        <textarea
                          placeholder="Describe the revision work performed or requested..."
                          className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm focus:ring-orange-400 focus:outline-none"
                          rows={3}
                          value={webdevForm.revDesc || ''}
                          onChange={(e) => setWebdevForm({ ...webdevForm, revDesc: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => createRevisionMutation.mutate(webdevForm.revDesc)}
                            disabled={!webdevForm.revDesc || createRevisionMutation.isPending}
                            className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50"
                          >
                            {createRevisionMutation.isPending ? 'Posting...' : 'Post Revision'}
                          </button>
                          <button
                            onClick={() => setWebdevForm({ ...webdevForm, showRevForm: false })}
                            className="bg-white text-gray-500 px-4 py-1.5 rounded-lg text-xs font-bold border border-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Revision Requests Allowed</label>
                        <input
                          type="number"
                          value={webdevForm.maxRevisions}
                          disabled={!canManage}
                          onChange={(e) => setWebdevForm({ ...webdevForm, maxRevisions: parseInt(e.target.value) })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-end pb-3">
                        <p className="text-sm text-gray-500">
                          Current revisions used: <span className="font-bold text-brandbook-600">{project.revisionCount || 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => updateProjectMutation.mutate({
                        figmaLink: webdevForm.figmaLink,
                        stagingLink: webdevForm.stagingLink,
                        maxRevisions: webdevForm.maxRevisions,
                      })}
                      disabled={updateProjectMutation.isPending}
                      className="mt-4 px-6 py-2.5 bg-brandbook-500 text-white text-sm font-bold rounded-xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-md shadow-brandbook-500/20"
                    >
                      {updateProjectMutation.isPending ? 'Saving…' : 'Save Web Dev Settings'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ───────────────── HANDOVER & SLA TAB ───────────────── */}
            {activeTab === 'handover' && handoverForm && project && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-brandbook-500" />
                  Project Handover & SLA Settings
                </h2>
                <div className="space-y-6">
                  <div className="pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4" /> Credentials & Training
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credentials Transfer Link</label>
                        <input
                          value={handoverForm.handoverCredentials}
                          disabled={!canManage}
                          placeholder="https://vault.bitwarden.com/..."
                          onChange={(e) => setHandoverForm({ ...handoverForm, handoverCredentials: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Slot (Date/Time)</label>
                        <input
                          type="datetime-local"
                          value={handoverForm.trainingScheduledAt}
                          disabled={!canManage}
                          onChange={(e) => setHandoverForm({ ...handoverForm, trainingScheduledAt: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <LifeBuoy className="w-4 h-4" /> Maintenance & Support (SLA)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3 h-full pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            className={cn(
                              "w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer",
                              handoverForm.hasSLA ? "bg-brandbook-500" : "bg-gray-200"
                            )}
                            onClick={() => {
                              if (!canManage) return;
                              setHandoverForm({ ...handoverForm, hasSLA: !handoverForm.hasSLA });
                            }}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full transition-transform duration-200",
                              handoverForm.hasSLA ? "translate-x-4" : "translate-x-0"
                            )} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Active SLA</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SLA Type</label>
                        <select
                          value={handoverForm.slaType}
                          disabled={!canManage || !handoverForm.hasSLA}
                          onChange={(e) => setHandoverForm({ ...handoverForm, slaType: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                        >
                          <option value="">Select SLA Tier</option>
                          <option value="MONTHLY">Monthly Maintenance</option>
                          <option value="YEARLY">Yearly SLA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SLA Agreement Document URL</label>
                        <input
                          value={handoverForm.slaDocumentUrl}
                          disabled={!canManage || !handoverForm.hasSLA}
                          placeholder="https://link-to-sla-doc.pdf"
                          onChange={(e) => setHandoverForm({ ...handoverForm, slaDocumentUrl: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={cn(
                            "w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer",
                            handoverForm.supportSystemActive ? "bg-emerald-500" : "bg-gray-200"
                          )}
                          onClick={() => {
                            if (!canManage) return;
                            setHandoverForm({ ...handoverForm, supportSystemActive: !handoverForm.supportSystemActive });
                          }}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-transform duration-200",
                            handoverForm.supportSystemActive ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Enable Support Ticket System</span>
                      </label>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => updateProjectMutation.mutate({
                        handoverCredentials: handoverForm.handoverCredentials,
                        trainingScheduledAt: handoverForm.trainingScheduledAt
                          ? new Date(handoverForm.trainingScheduledAt)
                          : null,
                        hasSLA: handoverForm.hasSLA,
                        slaType: handoverForm.slaType || null,
                        slaDocumentUrl: handoverForm.slaDocumentUrl,
                        supportSystemActive: handoverForm.supportSystemActive,
                      })}
                      disabled={updateProjectMutation.isPending}
                      className="mt-4 px-6 py-2.5 bg-brandbook-500 text-white text-sm font-bold rounded-xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-md shadow-brandbook-500/20"
                    >
                      {updateProjectMutation.isPending ? 'Saving…' : 'Save Handover & SLA'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ───────────────── TEAM TAB ───────────────── */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Team Members</h2>
                {project?.projectUsers?.map((pu: any) => (
                  <div key={pu.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-brandbook-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-brandbook-600">
                        {pu.user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pu.user?.name}</p>
                      <p className="text-xs text-gray-500">{pu.user?.email}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                      {pu.role.replace('_', ' ')}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => setEditingUser({ ...pu, permissions: pu.permissions || {} })}
                        className="ml-4 text-xs font-medium text-brandbook-500 hover:text-brandbook-600"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </div>
                ))}

                {editingUser && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Edit Permissions: {editingUser.user?.name}</h2>
                      <p className="text-sm text-gray-500 mb-6">Customize module access for this user on this project.</p>
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {['creatives', 'approvals', 'crm', 'calendar', 'communications', 'reports', 'onboarding', 'upsell'].map(module => {
                          const currentPerms = editingUser.permissions[module] || [];
                          return (
                            <div key={module} className="border border-gray-100 rounded-xl p-4">
                              <p className="font-medium text-sm text-gray-900 capitalize mb-3">{module}</p>
                              <div className="flex gap-4">
                                {['read', 'create', 'update', 'delete'].map(action => (
                                  <label key={action} className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-brandbook-500 focus:ring-brandbook-400"
                                      checked={currentPerms.includes(action)}
                                      onChange={(e) => {
                                        const newPerms = e.target.checked
                                          ? [...currentPerms, action]
                                          : currentPerms.filter((a: string) => a !== action);
                                        setEditingUser({
                                          ...editingUser,
                                          permissions: { ...editingUser.permissions, [module]: newPerms }
                                        });
                                      }}
                                    />
                                    <span className="capitalize">{action}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => updatePermissionsMutation.mutate({
                            userId: editingUser.userId,
                            role: editingUser.role,
                            permissions: editingUser.permissions
                          })}
                          disabled={updatePermissionsMutation.isPending}
                          className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600"
                        >
                          {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───────────────── APPROVALS TAB ───────────────── */}
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Approval Rules</h2>
                    {canManage && (
                      <button className="flex items-center gap-1.5 text-sm text-brandbook-500 hover:text-brandbook-700 font-medium">
                        <Plus className="w-4 h-4" /> Add Rule
                      </button>
                    )}
                  </div>
                  {ruleList.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No approval rules configured</p>
                  ) : (
                    <div className="space-y-3">
                      {ruleList.map((rule) => (
                        <div key={rule.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                              {rule.isLocked && (
                                <span className="flex items-center gap-1 text-xs text-orange-600">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {rule.requiresApproval && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Approval Required</span>
                              )}
                              {rule.approvalDeadlineHours && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                  {rule.approvalDeadlineHours}h Deadline
                                </span>
                              )}
                              {rule.autoApproveAfterDeadline && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Auto-approve after deadline</span>
                              )}
                              {rule.requiresClientApproval && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Client Approval</span>
                              )}
                            </div>
                          </div>
                          {canManage && user?.role === 'PROJECT_HEAD' && !rule.isLocked && (
                            <button
                              onClick={() => lockRuleMutation.mutate(rule.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" /> Lock
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ───────────────── RULES TAB ───────────────── */}
            {activeTab === 'rules' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Rule Engine Configurations</h2>
                {configs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No rule configurations. Use the rule engine to define automation.</p>
                ) : (
                  <div className="space-y-3">
                    {configs.map((config: any) => (
                      <div key={config.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{config.module} Rules</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Array.isArray(config.rules) ? config.rules.length : 0} rules configured
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {config.isLocked ? (
                            <span className="flex items-center gap-1 text-xs text-orange-600">
                              <Lock className="w-3.5 h-3.5" /> Locked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Unlock className="w-3.5 h-3.5" /> Active
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
