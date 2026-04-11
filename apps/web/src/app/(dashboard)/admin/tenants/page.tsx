'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { tenantsApi, servicesApi, projectsApi, usersApi } from '@/lib/api';
import { Tenant } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { Building2, Plus, Search, Edit2, MoreHorizontal, Globe, Users, FolderKanban, Trash2, FolderPlus, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectTenantId, setProjectTenantId] = useState('');
  const [newTenant, setNewTenant] = useState({ name: '', slug: '', industry: '', domain: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '', serviceId: '', projectManagerId: '', color: '#6366f1', icon: '📁' });

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', search],
    queryFn: () => tenantsApi.list({ search: search || undefined }),
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (dto: any) => tenantsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      setShowCreate(false);
      setNewTenant({ name: '', slug: '', industry: '', domain: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: any) => tenantsApi.update(editingTenant?.id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      setShowEdit(false);
      setEditingTenant(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
    enabled: showCreateProject,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.list({ roles: ['SUPER_ADMIN', 'PROJECT_HEAD'] }),
    enabled: showCreateProject,
  });

  const createProjectMutation = useMutation({
    mutationFn: (dto: any) => projectsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      setShowCreateProject(false);
      setNewProject({ name: '', description: '', serviceId: '', projectManagerId: '', color: '#6366f1', icon: '📁' });
      setProjectTenantId('');
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const tenants: Tenant[] = data?.tenants || [];

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Tenants"
        subtitle={`${data?.total || 0} clients`}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Tenant
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
          />
        </div>

        {/* Tenants Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />)}
          </div>
        ) : tenants.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tenants yet</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 bg-brandbook-500 text-white rounded-lg text-sm font-medium hover:bg-brandbook-600">
              Create First Tenant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brandbook-400 to-brandbook-600 flex items-center justify-center">
                      {tenant.logo ? (
                        <img src={tenant.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-xs text-gray-500">/{tenant.slug}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className="ml-2 flex gap-1 items-center">
                    <button
                      onClick={() => {
                        setEditingTenant(tenant);
                        setShowEdit(true);
                      }}
                      className="text-gray-400 hover:text-brandbook-600 transition-colors"
                      title="Edit Tenant"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this tenant? This action cannot be reversed.')) {
                          deleteMutation.mutate(tenant.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                      title="Delete Tenant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {tenant.industry && (
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> {tenant.industry}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {tenant._count?.tenantUsers || 0} users
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" />
                    {tenant._count?.projects || 0} projects
                  </span>
                  <button 
                    onClick={() => {
                      const el = document.getElementById(`projects-${tenant.id}`);
                      if (el) el.classList.toggle('hidden');
                    }}
                    className="ml-auto text-brandbook-600 hover:text-brandbook-700 font-bold hover:underline decoration-2 underline-offset-4"
                  >
                    Manage Projects
                  </button>
                </div>

                {/* Project List Extension */}
                <div id={`projects-${tenant.id}`} className="hidden mt-4 pt-4 border-t border-gray-100 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(tenant as any).projects?.filter((p: any) => !p.isArchived).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic py-2 text-center">No active projects</p>
                  ) : (
                    (tenant as any).projects?.filter((p: any) => !p.isArchived).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 group/item">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-sm flex-shrink-0">{p.icon || '📁'}</span>
                          <span className="text-[11px] font-bold text-gray-700 truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (window.confirm(`Archive Project "${p.name}"?`)) {
                                archiveProjectMutation.mutate(p.id);
                              }
                            }}
                            className="p-1 px-2.5 bg-white border border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                            title="Archive Project"
                          >
                            Archive
                          </button>
                          <Link
                            href={`/projects/${p.id}`}
                            className="p-1 px-2.5 bg-white border border-gray-200 text-gray-400 hover:text-brandbook-600 hover:border-brandbook-200 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Create Project button for this tenant */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => {
                      setProjectTenantId(tenant.id);
                      setShowCreateProject(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-brandbook-50 text-brandbook-700 text-xs font-bold rounded-xl hover:bg-brandbook-100 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Create Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-brandbook-50 rounded-2xl flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-brandbook-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                    <p className="text-xs text-gray-400">Under: <strong>{tenants.find(t => t.id === projectTenantId)?.name}</strong></p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Project Name *</label>
                  <input
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Brand Refresh 2025"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    rows={2}
                    placeholder="Brief project scope..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Service Package <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 font-normal ml-1">(required — defines available modules)</span>
                  </label>
                  <select
                    value={newProject.serviceId}
                    onChange={e => setNewProject({ ...newProject, serviceId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    <option value="">Select a service package…</option>
                    {(services || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {!newProject.serviceId && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> A service package must be selected to create a project.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Assign Project Manager</label>
                  <select
                    value={newProject.projectManagerId}
                    onChange={e => setNewProject({ ...newProject, projectManagerId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    <option value="">Assign later…</option>
                    {(staffData?.users || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Project Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newProject.color}
                        onChange={e => setNewProject({ ...newProject, color: e.target.value })}
                        className="w-12 h-10 border border-gray-200 rounded-xl cursor-pointer"
                      />
                      <span className="text-sm text-gray-400">{newProject.color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Icon</label>
                    <input
                      value={newProject.icon}
                      onChange={e => setNewProject({ ...newProject, icon: e.target.value })}
                      className="w-16 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => createProjectMutation.mutate({
                    ...newProject,
                    tenantId: projectTenantId,
                    projectManagerId: newProject.projectManagerId || undefined,
                  })}
                  disabled={!newProject.name || !newProject.serviceId || createProjectMutation.isPending}
                  className="flex-1 py-3.5 bg-brandbook-500 text-white font-bold rounded-2xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-lg shadow-brandbook-500/25"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  onClick={() => { setShowCreateProject(false); setProjectTenantId(''); }}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Tenant Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Tenant</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    placeholder="Acme Corporation" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input value={newTenant.slug}
                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    placeholder="acme-corporation" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={newTenant.industry} onChange={(e) => setNewTenant({ ...newTenant, industry: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    <option value="">Select industry</option>
                    {['E-Commerce', 'Real Estate', 'Healthcare', 'Education', 'Finance', 'Retail', 'Technology', 'F&B', 'Fashion', 'Other'].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input value={newTenant.domain}
                    onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="acme.com" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => createMutation.mutate(newTenant)} disabled={!newTenant.name || !newTenant.slug || createMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editingTenant && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Tenant</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input value={editingTenant.slug}
                    onChange={(e) => setEditingTenant({ ...editingTenant, slug: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={editingTenant.industry || ''} onChange={(e) => setEditingTenant({ ...editingTenant, industry: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    <option value="">Select industry</option>
                    {['E-Commerce', 'Real Estate', 'Healthcare', 'Education', 'Finance', 'Retail', 'Technology', 'F&B', 'Fashion', 'Other'].map(i => (
                       <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input value={editingTenant.domain || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, domain: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tenantActive" checked={editingTenant.isActive} 
                         onChange={(e) => setEditingTenant({ ...editingTenant, isActive: e.target.checked })} 
                         className="rounded" />
                  <label htmlFor="tenantActive" className="text-sm">Is Active?</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => updateMutation.mutate({
                    name: editingTenant.name, slug: editingTenant.slug,
                    industry: editingTenant.industry, domain: editingTenant.domain,
                    isActive: editingTenant.isActive
                  })} 
                  disabled={!editingTenant.name || !editingTenant.slug || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setShowEdit(false); setEditingTenant(null); }}
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
