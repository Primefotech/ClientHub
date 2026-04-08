'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { projectsApi, approvalsApi, ruleEngineApi, usersApi } from '@/lib/api';
import { ApprovalRule } from '@/types';
import { cn } from '@/lib/utils';
import { Settings, Zap, Users, Lock, Unlock, Shield, Plus, Trash2 } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'approvals', label: 'Approval Rules', icon: Shield },
  { id: 'rules', label: 'Rule Engine', icon: Zap },
];

export default function ProjectSettingsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [editingUser, setEditingUser] = useState<any>(null);

  const canManage = ['SUPER_ADMIN', 'PROJECT_HEAD'].includes(user?.role || '');

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
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">General Settings</h2>
                {project && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                      <input defaultValue={project.name}
                        disabled={!canManage}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 disabled:bg-gray-50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea defaultValue={project.description || ''}
                        disabled={!canManage}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none disabled:bg-gray-50" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select defaultValue={project.status}
                          disabled={!canManage}
                          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                          <option>ACTIVE</option>
                          <option>PAUSED</option>
                          <option>COMPLETED</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <input type="color" defaultValue={project.color || '#6366f1'}
                          disabled={!canManage}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer" />
                      </div>
                    </div>
                    {canManage && (
                      <button className="mt-2 px-4 py-2 bg-brandbook-500 text-white text-sm font-medium rounded-lg hover:bg-brandbook-600 transition-colors">
                        Save Changes
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

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
                      <p className="text-sm text-gray-500 mb-6">Customize modules access for this user on this project. This overrides their global role limits.</p>
                      
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
