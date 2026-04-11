'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { contentTypesApi, projectsApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Archive, RotateCcw, Trash2, ShieldOff, FolderKanban, Globe, Search } from 'lucide-react';

export default function AdminArchivePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'projects' | 'content-types'>('projects');
  const [search, setSearch] = useState('');

  // Guard: Admin only
  if (user && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-sm max-w-sm">Archive management is only available to Super Administrators.</p>
      </div>
    );
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: archivedTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['archived-content-types'],
    queryFn: () => contentTypesApi.list({ includeArchived: true }),
    enabled: activeTab === 'content-types',
  });

  const { data: archivedProjectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['archived-projects'],
    queryFn: () => projectsApi.list({ includeArchived: true }),
    enabled: activeTab === 'projects',
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const restoreTypeMutation = useMutation({
    mutationFn: (id: string) => contentTypesApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archived-content-types'] }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => contentTypesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archived-content-types'] }),
  });

  const restoreProjectMutation = useMutation({
    mutationFn: (id: string) => projectsApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archived-projects'] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archived-projects'] }),
  });

  // ── Processing ───────────────────────────────────────────────────────────────
  const allTypes = Array.isArray(archivedTypes) ? archivedTypes : [];
  const archivedTypesList = allTypes.filter(t => (t as any).isArchived);
  const filteredTypes = archivedTypesList.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const allProjects = Array.isArray(archivedProjectsData?.projects) ? archivedProjectsData.projects : [];
  const archivedProjectsList = allProjects.filter(p => (p as any).isArchived);
  const filteredProjects = archivedProjectsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.tenant?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = activeTab === 'projects' ? loadingProjects : loadingTypes;
  const currentCount = activeTab === 'projects' ? filteredProjects.length : filteredTypes.length;

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/30">
      <Header
        user={user!}
        title="Archive Hub"
        subtitle={`${currentCount} archived item${currentCount !== 1 ? 's' : ''} in ${activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
        actions={
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'projects' ? "bg-white shadow-sm text-brandbook-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FolderKanban className="w-4 h-4" /> Projects
            </button>
            <button
              onClick={() => setActiveTab('content-types')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'content-types' ? "bg-white shadow-sm text-brandbook-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileIcon className="w-4 h-4" /> Content Types
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <Archive className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Archive Management</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Archived items are hidden from workspaces but retained in the database. 
              {activeTab === 'projects' ? " Archiving a project also hides all its associated creatives and leads." : " Content types can be restored to individual projects or the global pool."}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search archived ${activeTab.replace('-', ' ')}…`}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
          />
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
            ))}
          </div>
        ) : currentCount === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Archive className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No archived items found</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {search ? 'Try adjusting your search filters.' : `You haven't archived any ${activeTab.replace('-', ' ')} yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'projects' ? (
              filteredProjects.map((p: any) => (
                <ArchiveCard
                  key={p.id}
                  title={p.name}
                  subtitle={p.tenant?.name || 'No Tenant'}
                  meta={`${p._count?.creatives || 0} creatives · ${p._count?.crmLeads || 0} leads`}
                  icon={p.icon || '📁'}
                  color={p.color}
                  archivedAt={p.archivedAt}
                  onRestore={() => restoreProjectMutation.mutate(p.id)}
                  onDelete={() => {
                    if (window.confirm(`Permanently delete project "${p.name}"? ALL DATA WILL BE LOST.`)) {
                      deleteProjectMutation.mutate(p.id);
                    }
                  }}
                  isPending={restoreProjectMutation.isPending || deleteProjectMutation.isPending}
                />
              ))
            ) : (
              filteredTypes.map((ct: any) => (
                <ArchiveCard
                  key={ct.id}
                  title={ct.name}
                  subtitle={ct.isGlobal ? 'Global Type' : 'Project Specific'}
                  meta={`${ct._count?.creatives || 0} creatives using this type`}
                  icon={ct.icon || '📄'}
                  color={ct.color}
                  archivedAt={ct.archivedAt}
                  onRestore={() => restoreTypeMutation.mutate(ct.id)}
                  onDelete={() => {
                    if (window.confirm(`Permanently delete content type "${ct.name}"?`)) {
                      deleteTypeMutation.mutate(ct.id);
                    }
                  }}
                  isPending={restoreTypeMutation.isPending || deleteTypeMutation.isPending}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ArchiveCard({ title, subtitle, meta, icon, color, archivedAt, onRestore, onDelete, isPending }: any) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300 opacity-90 hover:opacity-100">
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${color || '#6366f1'}20` }}
        >
          {icon}
        </div>
        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Archived</span>
      </div>

      <h3 className="font-bold text-gray-900 mb-1 truncate">{title}</h3>
      <p className="text-xs text-brandbook-600 font-bold mb-1">{subtitle}</p>
      
      <div className="text-[11px] text-gray-400 mb-4">
        <p>{meta}</p>
        {archivedAt && (
          <p className="mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Archived {formatDate(archivedAt)}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <button
          onClick={onRestore}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restore
        </button>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
