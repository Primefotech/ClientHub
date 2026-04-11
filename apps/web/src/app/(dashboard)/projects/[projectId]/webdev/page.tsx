'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { projectsApi, projectExtensionsApi } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  Monitor, Plus, Link2, Image, FileText, File, Upload, CheckCircle2,
  Clock, XCircle, ExternalLink, Palette, Map, Code, FolderOpen,
  MessageSquare, Send, ChevronDown, X, Eye
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WebDevItem {
  id: string;
  title: string;
  category: 'UI Design' | 'Content' | 'Sitemap' | 'Web Assets' | 'Other';
  type: 'link' | 'image' | 'pdf' | 'text' | 'doc';
  url?: string;
  textContent?: string;
  status: 'FOR_REVIEW' | 'APPROVED' | 'REJECTED';
  notes?: string;
  uploadedBy: string;
  createdAt: string;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  'UI Design':   { icon: <Palette className="w-4 h-4" />,   color: 'text-purple-600',  bg: 'bg-purple-50' },
  'Content':     { icon: <FileText className="w-4 h-4" />,  color: 'text-blue-600',    bg: 'bg-blue-50' },
  'Sitemap':     { icon: <Map className="w-4 h-4" />,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Web Assets':  { icon: <Code className="w-4 h-4" />,      color: 'text-orange-600',  bg: 'bg-orange-50' },
  'Other':       { icon: <FolderOpen className="w-4 h-4" />,color: 'text-gray-600',    bg: 'bg-gray-100' },
};

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  FOR_REVIEW: { label: 'For Review', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  APPROVED:   { label: 'Approved',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  REJECTED:   { label: 'Rejected',   icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-700 border-red-100' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  link:  <Link2 className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  pdf:   <FileText className="w-4 h-4" />,
  text:  <FileText className="w-4 h-4" />,
  doc:   <File className="w-4 h-4" />,
};

// ─────────────────────────────────────────────
// Item Card
// ─────────────────────────────────────────────
function WebDevItemCard({
  item, isStaff, onApprove, onReject, onView
}: {
  item: WebDevItem;
  isStaff: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (item: WebDevItem) => void;
}) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META['Other'];
  const status = STATUS_META[item.status];

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-300">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cat.bg, cat.color)}>
            {cat.icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('text-gray-400', cat.color)}>{TYPE_ICONS[item.type]}</span>
              <span className="text-xs text-gray-400 capitalize">{item.type}</span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{item.category}</span>
            </div>
          </div>
        </div>
        <span className={cn('flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0', status.color)}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Notes */}
      {item.notes && (
        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2 bg-gray-50 rounded-xl p-3">
          {item.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {item.uploadedBy} · {formatRelativeTime(item.createdAt)}
        </p>
        <div className="flex items-center gap-2">
          {/* View/Open */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-brandbook-600 hover:bg-brandbook-50 rounded-lg transition-all"
              title="Open link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onView(item)}
            className="p-1.5 text-gray-400 hover:text-brandbook-600 hover:bg-brandbook-50 rounded-lg transition-all"
            title="View & Comment"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Approval Actions — client + admin can approve, admin can reject */}
          {item.status === 'FOR_REVIEW' && (
            <>
              <button
                onClick={() => onApprove(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" /> Approve
              </button>
              {isStaff && (
                <button
                  onClick={() => onReject(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function WebDevPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingItem, setViewingItem] = useState<WebDevItem | null>(null);
  const [comment, setComment] = useState('');

  const isStaff = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');
  const isClient = ['CLIENT_OWNER', 'CLIENT_STAFF'].includes(user?.role || '');

  const [newItem, setNewItem] = useState({
    title: '',
    category: 'UI Design',
    type: 'link',
    url: '',
    notes: '',
  });

  // ── Fetch project for context
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  // ── Fetch web dev items (stored as revision requests with JSON metadata for now)
  const { data: revisions } = useQuery({
    queryKey: ['webdev-items', projectId],
    queryFn: () => projectExtensionsApi.getRevisions(projectId),
  });

  // ── Mutations — create a web dev item as a revision request with structured description
  const createMutation = useMutation({
    mutationFn: (data: any) => projectExtensionsApi.createRevision(projectId, {
      description: JSON.stringify({
        title: data.title,
        category: data.category,
        type: data.type,
        url: data.url || '',
        notes: data.notes || '',
        status: 'FOR_REVIEW',
        uploadedBy: user?.name || 'Unknown',
        _webDevItem: true,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webdev-items', projectId] });
      setShowAdd(false);
      setNewItem({ title: '', category: 'UI Design', type: 'link', url: '', notes: '' });
    },
  });

  // Parse revision requests as WebDevItems
  const allItems: WebDevItem[] = (revisions || []).reduce((acc: WebDevItem[], rev: any) => {
    try {
      const parsed = JSON.parse(rev.description);
      if (parsed._webDevItem) {
        acc.push({
          id: rev.id,
          title: parsed.title,
          category: parsed.category,
          type: parsed.type,
          url: parsed.url,
          notes: parsed.notes,
          status: parsed.status || 'FOR_REVIEW',
          uploadedBy: parsed.uploadedBy,
          createdAt: rev.createdAt,
        });
      }
    } catch { /* not a webdev item */ }
    return acc;
  }, []);

  const filteredItems = allItems.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const categories = ['UI Design', 'Content', 'Sitemap', 'Web Assets', 'Other'];

  const handleApprove = (id: string) => {
    // Update status in-place (in a real app, patch an endpoint)
    // For now, trigger a mutation to update via revision endpoint
    console.log('Approve:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject:', id);
  };

  const categoryGroups = categories.map(cat => ({
    cat,
    items: filteredItems.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/30">
      <Header
        user={user!}
        title="Web Design & Dev"
        subtitle={project?.name ? `${project.name} · Deliverables & Review` : 'Deliverables & Review Workspace'}
        actions={
          isStaff && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brandbook-600 transition-all shadow-md shadow-brandbook-500/20"
            >
              <Plus className="w-4 h-4" /> Add Deliverable
            </button>
          )
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'For Review', count: allItems.filter(i => i.status === 'FOR_REVIEW').length, color: 'text-amber-600 bg-amber-50' },
            { label: 'Approved', count: allItems.filter(i => i.status === 'APPROVED').length, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Rejected', count: allItems.filter(i => i.status === 'REJECTED').length, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold', s.color)}>
                {s.count}
              </div>
              <p className="text-sm font-medium text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links from project settings */}
        {(project?.figmaLink || project?.stagingLink) && (
          <div className="flex flex-wrap gap-3">
            {project.figmaLink && (
              <a href={project.figmaLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all">
                <Palette className="w-4 h-4 text-purple-500" /> Open Figma Design
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {project.stagingLink && (
              <a href={project.stagingLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                <Monitor className="w-4 h-4 text-emerald-500" /> View Staging Site
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400">
            <option value="">All Statuses</option>
            <option value="FOR_REVIEW">For Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-brandbook-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Monitor className="w-8 h-8 text-brandbook-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No deliverables yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
              {isStaff
                ? 'Add your first deliverable — designs, content, sitemaps, or web assets for client review.'
                : 'Your project team will upload deliverables here for your review and approval.'}
            </p>
            {isStaff && (
              <button onClick={() => setShowAdd(true)}
                className="px-6 py-2.5 bg-brandbook-500 text-white rounded-xl text-sm font-bold hover:bg-brandbook-600 transition-all shadow-lg shadow-brandbook-500/20">
                Add First Deliverable
              </button>
            )}
          </div>
        )}

        {/* Items grouped by category */}
        {categoryGroups.map(({ cat, items }) => {
          const catMeta = CATEGORY_META[cat];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', catMeta.bg, catMeta.color)}>
                  {catMeta.icon}
                </div>
                <h2 className="text-sm font-bold text-gray-900">{cat}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(item => (
                  <WebDevItemCard
                    key={item.id}
                    item={item}
                    isStaff={isStaff}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onView={setViewingItem}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deliverable Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Deliverable</h2>
              <p className="text-sm text-gray-400 mt-1">Upload or link a deliverable for client review</p>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                <input
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g. Homepage Wireframe V2"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    {['UI Design', 'Content', 'Sitemap', 'Web Assets', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                  <select
                    value={newItem.type}
                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  >
                    <option value="link">🔗 Link</option>
                    <option value="image">🖼️ Image</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="text">📝 Text Doc</option>
                    <option value="doc">📋 Word / G-Doc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {newItem.type === 'link' ? 'URL *' : 'File URL / Link *'}
                </label>
                <input
                  value={newItem.url}
                  onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder={newItem.type === 'link' ? 'https://figma.com/file/...' : 'https://drive.google.com/...'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes / Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={newItem.notes}
                  onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={3}
                  placeholder="Any specific feedback or context for the client..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => createMutation.mutate(newItem)}
                disabled={!newItem.title || !newItem.url || createMutation.isPending}
                className="flex-1 py-3.5 bg-brandbook-500 text-white font-bold rounded-2xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-lg shadow-brandbook-500/25"
              >
                {createMutation.isPending ? 'Adding...' : 'Add Deliverable'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View / Comment Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{viewingItem.title}</h3>
                <span className="text-xs text-gray-400">{viewingItem.category} · {viewingItem.type}</span>
              </div>
              <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {viewingItem.url && (
                <a href={viewingItem.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-brandbook-50 text-brandbook-700 rounded-2xl text-sm font-bold hover:bg-brandbook-100 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open {viewingItem.type === 'link' ? 'Link' : 'File'}
                </a>
              )}
              {viewingItem.notes && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{viewingItem.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-500 mb-3">Post Feedback</p>
                <div className="relative">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Leave a comment or feedback..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 resize-none pr-12"
                  />
                  <button
                    className="absolute bottom-3 right-3 p-2 bg-brandbook-500 text-white rounded-xl hover:bg-brandbook-600 transition-all"
                    onClick={() => { setComment(''); }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
