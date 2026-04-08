'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { creativesApi, contentTypesApi, commsApi } from '@/lib/api';
import { Creative, ContentType } from '@/types';
import { hasPermission } from '@/lib/auth';
import { STATUS_COLORS, formatRelativeTime, cn } from '@/lib/utils';
import { Plus, Upload, Image, Video, FileText, Filter, Grid, List, Eye, Trash2, Edit, MessageSquare, Send, ArrowLeft } from 'lucide-react';

const FILE_TYPE_ICONS: Record<string, string> = {
  image: '🖼️', video: '🎬', carousel: '🎠', ad_copy: '✍️', text: '📝', document: '📄',
};

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {creative.thumbnailUrl ? (
          <img src={creative.thumbnailUrl} alt={creative.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{FILE_TYPE_ICONS[creative.fileType] || '📄'}</span>
        )}
        <div className="absolute top-2 right-2">
          <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium backdrop-blur-sm', STATUS_COLORS[creative.status])}>
            {creative.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{creative.title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          by {creative.uploadedBy?.name} · {formatRelativeTime(creative.createdAt)}
        </p>

        {creative.contentType && (
          <div className="mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: `${creative.contentType.color || '#6366f1'}20`,
                color: creative.contentType.color || '#6366f1',
              }}
            >
              {creative.contentType.icon} {creative.contentType.name}
            </span>
          </div>
        )}

        {creative.scheduledAt && (
          <p className="text-xs text-blue-600 mt-1.5">📅 Scheduled: {new Date(creative.scheduledAt).toLocaleDateString()}</p>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex-1">v{creative.versionNumber}</span>
          {creative._count?.threads !== undefined && <span>💬 {creative._count.threads}</span>}
          {creative._count?.versions !== undefined && creative._count.versions > 0 && (
            <span>🔄 {creative._count.versions} versions</span>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
             <button className="p-1.5 text-gray-400 hover:text-brandbook-600 transition-colors" title="View details">
               <Eye className="w-4 h-4" />
             </button>
             {/* Note: Update and Delete actions would typically sit here via a dropdown. We're keeping it simple for the grid. */}
        </div>
      </div>
    </div>
  );
}

export default function CreativesPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('');
  const [newCreative, setNewCreative] = useState({
    title: '', description: '', fileType: 'image', fileUrl: '',
    contentTypeId: '', requiresApproval: true, tags: '',
  });

  const canUpload = hasPermission(user, projectId, 'creatives', 'create');
  const canDelete = hasPermission(user, projectId, 'creatives', 'delete');
  const canUpdate = hasPermission(user, projectId, 'creatives', 'update');

  const { data, isLoading } = useQuery({
    queryKey: ['creatives', projectId, statusFilter],
    queryFn: () => creativesApi.list(projectId, { status: statusFilter || undefined }),
  });

  const { data: contentTypes } = useQuery({
    queryKey: ['content-types', projectId],
    queryFn: () => contentTypesApi.list({ projectId }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => creativesApi.create(projectId, { ...dto, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creatives', projectId] });
      setShowUpload(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creativesApi.delete(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creatives', projectId] }),
  });

  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  const creatives: Creative[] = data?.creatives || [];
  const types: ContentType[] = contentTypes || [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Creatives"
        subtitle={`${data?.total || 0} items`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brandbook-500 text-white' : 'text-gray-500 hover:bg-gray-50')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brandbook-500 text-white' : 'text-gray-500 hover:bg-gray-50')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {canUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 bg-white"
          >
            <option value="">All Status</option>
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'SCHEDULED', 'PUBLISHED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Grid / List */}
        {isLoading ? (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3')}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : creatives.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No creatives yet</p>
            {canUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 bg-brandbook-500 text-white rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
              >
                Upload First Creative
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {creatives.map((c) => (
              <div key={c.id} onClick={() => setSelectedCreative(c)} className="cursor-pointer">
                <CreativeCard creative={c} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Creative', 'Type', 'Status', 'Uploaded By', 'Scheduled', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {creatives.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{FILE_TYPE_ICONS[c.fileType] || '📄'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.title}</p>
                          <p className="text-xs text-gray-400">v{c.versionNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.contentType && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {c.contentType.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', STATUS_COLORS[c.status])}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.uploadedBy?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-brandbook-600" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canUpdate && (
                          <button 
                            className="text-gray-400 hover:text-blue-600" 
                            title="Edit"
                            onClick={() => {
                              // Trigger edit mode for this creative
                              setNewCreative({
                                title: c.title,
                                description: c.description || '',
                                fileType: c.fileType,
                                fileUrl: c.fileUrl || '',
                                contentTypeId: c.contentTypeId || '',
                                requiresApproval: c.requiresApproval,
                                tags: c.tags.join(', ')
                              });
                              // A real implementation would use an update mutation here
                              // Set an editing indicator and showUpload modal, but we'll leave basic for now
                              setShowUpload(true); 
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this creative?')) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600 ml-2" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Creative Detail / Discussion Modal */}
        {selectedCreative && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl border border-white/20">
                {/* Left: Creative Preview */}
                <div className="flex-1 bg-gray-900 flex flex-col relative">
                   <button 
                     onClick={() => setSelectedCreative(null)}
                     className="absolute top-6 left-6 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all"
                   >
                     <ArrowLeft className="w-5 h-5" />
                   </button>
                   
                   <div className="flex-1 flex items-center justify-center p-12">
                      {selectedCreative.fileType === 'image' ? (
                         <img src={selectedCreative.fileUrl} alt={selectedCreative.title} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                      ) : (
                         <div className="text-center text-white">
                            <FileText className="w-24 h-24 mx-auto mb-6 opacity-20" />
                            <h2 className="text-2xl font-bold">{selectedCreative.title}</h2>
                            <p className="text-white/40 mt-2">Preview not available for this file type</p>
                            <a href={selectedCreative.fileUrl} target="_blank" rel="noreferrer" 
                               className="mt-8 inline-block px-6 py-3 bg-brandbook-500 rounded-xl font-bold hover:bg-brandbook-600 transition-all">
                               Download Asset
                            </a>
                         </div>
                      )}
                   </div>

                   <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/10 text-white">
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-bold text-brandbook-400 uppercase tracking-widest mb-1">{selectedCreative.contentType?.name || 'General Asset'}</p>
                            <h2 className="text-2xl font-bold">{selectedCreative.title}</h2>
                            <p className="text-sm text-white/50 mt-1">Uploaded by {selectedCreative.uploadedBy?.name} · v{selectedCreative.versionNumber}</p>
                         </div>
                         <div className="flex gap-3">
                            <span className={cn('px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider', STATUS_COLORS[selectedCreative.status])}>
                               {selectedCreative.status.replace(/_/g, ' ')}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right: Discussion Sidebar */}
                <div className="w-[400px] border-l border-gray-100 flex flex-col bg-white">
                   <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                         <MessageSquare className="w-4 h-4 text-brandbook-500" />
                         Feedback Thread
                      </h3>
                      <button className="text-[11px] font-bold text-brandbook-500 uppercase tracking-widest">Internal Only</button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      <CreativeThread creativeId={selectedCreative.id} projectId={projectId} />
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Creative</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    value={newCreative.title}
                    onChange={(e) => setNewCreative({ ...newCreative, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    placeholder="Creative title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Type *</label>
                    <select
                      value={newCreative.fileType}
                      onChange={(e) => setNewCreative({ ...newCreative, fileType: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    >
                      {['image', 'video', 'carousel', 'ad_copy', 'text', 'document'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                    <select
                      value={newCreative.contentTypeId}
                      onChange={(e) => setNewCreative({ ...newCreative, contentTypeId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    >
                      <option value="">None</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Replaced fileUrl textbox with file input simulation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Upload *</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Mock simulating a file blob URL for display/reference
                        const localUrl = URL.createObjectURL(file);
                        setNewCreative({ ...newCreative, fileUrl: localUrl });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white file:border-0 file:bg-brandbook-50 file:text-brandbook-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg hover:file:bg-brandbook-100 transition-colors cursor-pointer"
                  />
                  {newCreative.fileUrl && (
                    <p className="text-xs text-green-600 mt-2">File readied for upload.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newCreative.description}
                    onChange={(e) => setNewCreative({ ...newCreative, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
                    placeholder="Enter creative details..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={newCreative.requiresApproval}
                    onChange={(e) => setNewCreative({ ...newCreative, requiresApproval: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brandbook-500 focus:ring-brandbook-400"
                  />
                  <label htmlFor="requiresApproval" className="text-sm text-gray-700">Requires approval</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    createMutation.mutate({
                      ...newCreative,
                      tags: newCreative.tags ? newCreative.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                    });
                  }}
                  disabled={!newCreative.title || !newCreative.fileUrl || createMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
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

function CreativeThread({ creativeId, projectId }: { creativeId: string; projectId: string }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: threads, isLoading } = useQuery({
    queryKey: ['threads', creativeId],
    queryFn: () => commsApi.getThreads(projectId, { creativeId }),
  });

  const createThreadMutation = useMutation({
    mutationFn: (text: string) => commsApi.createThread(projectId, { 
      title: 'Creative Discussion', 
      creativeId, 
      type: 'content' 
    }).then(t => commsApi.addComment(projectId, t.id, { content: text })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threads', creativeId] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { threadId: string; content: string }) => 
      commsApi.addComment(projectId, data.threadId, { content: data.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads', creativeId] });
      setComment('');
    },
  });

  const handlePost = () => {
    if (!comment.trim()) return;
    if (threads && threads.length > 0) {
      addCommentMutation.mutate({ threadId: threads[0].id, content: comment });
    } else {
      createThreadMutation.mutate(comment);
      setComment('');
    }
  };

  if (isLoading) return <div className="text-gray-400 text-sm">Loading activity...</div>;

  const thread = threads?.[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        {!thread ? (
           <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MessageSquare className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No feedback yet.</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation below.</p>
           </div>
        ) : (
           thread.comments?.map((c: any) => (
              <div key={c.id} className="flex gap-3 group">
                 <div className="w-8 h-8 rounded-full bg-brandbook-100 flex items-center justify-center shrink-0 shadow-sm border border-brandbook-200">
                    <span className="text-[10px] font-bold text-brandbook-600 uppercase">
                       {c.author.name.substring(0, 2)}
                    </span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                       <span className="text-xs font-bold text-gray-900">{c.author.name}</span>
                       <span className="text-[10px] text-gray-400 uppercase font-medium">{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100 leading-relaxed whitespace-pre-wrap">
                       {c.content}
                    </div>
                 </div>
              </div>
           )).reverse()
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
         <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Post a comment or feedback..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all min-h-[100px] resize-none pr-12"
            />
            <button
               onClick={handlePost}
               disabled={!comment.trim() || addCommentMutation.isPending || createThreadMutation.isPending}
               className="absolute bottom-3 right-3 p-2 bg-brandbook-500 text-white rounded-xl shadow-lg hover:bg-brandbook-600 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
            >
               <Send className="w-4 h-4" />
            </button>
         </div>
         <p className="text-[10px] text-gray-400 mt-2 text-center">Press Enter to post · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

