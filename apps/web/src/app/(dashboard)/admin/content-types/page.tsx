'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { contentTypesApi } from '@/lib/api';
import { ContentType } from '@/types';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Globe, Lock, Trash2, Edit2 } from 'lucide-react';

export default function ContentTypesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [viewArchived, setViewArchived] = useState(false);
  const [newType, setNewType] = useState({
    name: '', description: '', isGlobal: true, icon: '📄', color: '#6366f1',
    defaultApprovalRequired: true, defaultAutoApprove: false,
  });

  const { data: types, isLoading } = useQuery({
    queryKey: ['content-types-admin', viewArchived],
    queryFn: () => contentTypesApi.list({ isGlobal: true, includeArchived: viewArchived }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => contentTypesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-types-admin'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => contentTypesApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-types-admin'] });
      setEditingType(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => contentTypesApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-types-admin'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => contentTypesApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-types-admin'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentTypesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-types-admin'] }),
  });

  const contentTypes: ContentType[] = Array.isArray(types) ? types : [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Content Types"
        subtitle="Global content type definitions"
        actions={
          <div className="flex items-center gap-3">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewArchived(false)}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", !viewArchived ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
                >
                  Active
                </button>
                <button
                  onClick={() => setViewArchived(true)}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", viewArchived ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
                >
                  Archived
                </button>
              </div>
            )}
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors">
              <Plus className="w-4 h-4" /> New Type
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-xl border h-32 animate-pulse" />)}
          </div>
        ) : contentTypes.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No content types yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contentTypes.map((ct) => (
              <div key={ct.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${ct.color || '#6366f1'}20` }}
                  >
                    {ct.icon || '📄'}
                  </div>
                  <div className="flex items-center gap-1">
                    {ct.isGlobal && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Globe className="w-3 h-3" /> Global
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{ct.name}</h3>
                {ct.description && <p className="text-xs text-gray-500 mb-3">{ct.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {ct.defaultApprovalRequired && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Approval Required</span>
                  )}
                  {ct.defaultAutoApprove && (
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded">Auto-approve</span>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{(ct as any)._count?.creatives || 0} creatives</span>
                  <div className="ml-auto flex gap-1">
                    {!viewArchived ? (
                      <>
                        <button onClick={() => setEditingType(ct)} className="p-1.5 text-gray-400 hover:text-brandbook-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => archiveMutation.mutate(ct.id)}
                          className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors" title="Archive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => restoreMutation.mutate(ct.id)}
                          className="p-1.5 text-gray-400 hover:text-green-500 transition-colors" title="Restore">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {user?.role === 'SUPER_ADMIN' && (
                          <button onClick={() => deleteMutation.mutate(ct.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Permanent Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {(showCreate || editingType) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">{editingType ? 'Edit Content Type' : 'New Content Type'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Name *</label>
                  <input value={editingType ? editingType.name : newType.name} 
                    onChange={(e) => editingType ? setEditingType({ ...editingType, name: e.target.value }) : setNewType({ ...newType, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all"
                    placeholder="e.g. Social Media Post" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea value={editingType ? editingType.description || '' : newType.description} 
                    onChange={(e) => editingType ? setEditingType({ ...editingType, description: e.target.value }) : setNewType({ ...newType, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm min-h-[80px]"
                    placeholder="Brief description of when to use this type" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Icon (Emoji)</label>
                    <input value={editingType ? editingType.icon || '' : newType.icon} 
                      onChange={(e) => editingType ? setEditingType({ ...editingType, icon: e.target.value }) : setNewType({ ...newType, icon: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center text-xl" placeholder="📄" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Brand Color</label>
                    <input type="color" value={editingType ? editingType.color || '#6366f1' : newType.color} 
                      onChange={(e) => editingType ? setEditingType({ ...editingType, color: e.target.value }) : setNewType({ ...newType, color: e.target.value })}
                      className="w-full h-[50px] border border-gray-200 rounded-xl cursor-pointer bg-white p-1" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={editingType ? editingType.defaultApprovalRequired : newType.defaultApprovalRequired}
                      onChange={(e) => editingType ? setEditingType({ ...editingType, defaultApprovalRequired: e.target.checked }) : setNewType({ ...newType, defaultApprovalRequired: e.target.checked })}
                      className="rounded border-gray-300 text-brandbook-500 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Approval required by default</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={editingType ? editingType.isGlobal : newType.isGlobal}
                      onChange={(e) => editingType ? setEditingType({ ...editingType, isGlobal: e.target.checked }) : setNewType({ ...newType, isGlobal: e.target.checked })}
                      className="rounded border-gray-300 text-brandbook-500 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Global (shared across projects)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => {
                    if (editingType) {
                      // Only send the fields the API accepts — strip Prisma relations
                      const dto = {
                        name: editingType.name,
                        description: editingType.description,
                        icon: editingType.icon,
                        color: editingType.color,
                        isGlobal: editingType.isGlobal,
                        defaultApprovalRequired: editingType.defaultApprovalRequired,
                        defaultAutoApprove: editingType.defaultAutoApprove,
                        autoApproveAfterHours: editingType.autoApproveAfterHours,
                      };
                      updateMutation.mutate({ id: editingType.id, dto });
                    } else {
                      createMutation.mutate(newType);
                    }
                  }}
                  disabled={(editingType ? !editingType.name : !newType.name) || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-brandbook-500 text-white font-bold rounded-xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                >
                  {editingType ? (updateMutation.isPending ? 'Saving...' : 'Save Changes') : (createMutation.isPending ? 'Creating...' : 'Create Type')}
                </button>
                <button onClick={() => { setShowCreate(false); setEditingType(null); }}
                  className="flex-1 py-3 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm"
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
