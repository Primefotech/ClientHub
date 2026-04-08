'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { tenantsApi } from '@/lib/api';
import { Tenant } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { Building2, Plus, Search, Edit2, MoreHorizontal, Globe, Users, FolderKanban, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', slug: '', industry: '', domain: '' });

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
                  <span className="ml-auto">{formatDate(tenant.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
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
