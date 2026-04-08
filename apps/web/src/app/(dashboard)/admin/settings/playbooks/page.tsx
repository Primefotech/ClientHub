'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { playbooksApi } from '@/lib/api';
import { BookOpen, Save, Shield, Users, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PLAYBOOK_SLUGS = [
  { slug: 'admin-playbook', title: 'Internal Admin Playbook', type: 'ADMIN', icon: <Shield className="w-4 h-4" /> },
  { slug: 'client-playbook', title: 'Client Experience Playbook', type: 'CLIENT', icon: <Users className="w-4 h-4" /> },
];

export default function PlaybookEditorPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useState(PLAYBOOK_SLUGS[0].slug);
  const [content, setContent] = useState('');

  const { data: playbook, isLoading } = useQuery({
    queryKey: ['playbook', activeSlug],
    queryFn: () => playbooksApi.get(activeSlug).catch(() => null),
  });

  // Update local content when data loads
  const currentTitle = PLAYBOOK_SLUGS.find(s => s.slug === activeSlug)?.title || '';
  const currentType = PLAYBOOK_SLUGS.find(s => s.slug === activeSlug)?.type || 'ADMIN';

  const upsertMutation = useMutation({
    mutationFn: (text: string) => playbooksApi.upsert({
      slug: activeSlug,
      title: currentTitle,
      type: currentType,
      content: { text },
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playbook', activeSlug] }),
  });

  const handleSave = () => {
    upsertMutation.mutate(content || (playbook?.content?.text || ''));
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#f8fafc]">
      <Header
        user={user!}
        title="Playbook Editor"
        subtitle="Manage the manuals and guides shown to staff and clients"
        actions={
          <Link href="/admin/settings" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
        }
      />

      <div className="flex-1 p-6 flex gap-8 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Select Manual</p>
            {PLAYBOOK_SLUGS.map((item) => (
              <button
                key={item.slug}
                onClick={() => { setActiveSlug(item.slug); setContent(''); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
                  activeSlug === item.slug ? "bg-brandbook-50 text-brandbook-600 font-bold shadow-inner" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", activeSlug === item.slug ? "bg-brandbook-100" : "bg-gray-100")}>
                  {item.icon}
                </div>
                <span className="text-sm">{item.title}</span>
              </button>
            ))}
          </div>
          
          <div className="bg-brandbook-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl transition-all group-hover:scale-110" />
            <BookOpen className="w-8 h-8 opacity-20 mb-4" />
            <h4 className="font-bold text-sm mb-2">Editor Guide</h4>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Use standard Markdown or plain text. These updates are reflected instantly in the help sections of the respective profiles.
            </p>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div>
               <h3 className="font-bold text-gray-900">{currentTitle}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Slug: {activeSlug}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brandbook-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {upsertMutation.isPending ? 'Saving...' : 'Save Manual'}
            </button>
          </div>
          
          <div className="flex-1 p-6">
            <textarea
              value={content !== '' ? content : (playbook?.content?.text || '')}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your playbook content here... (Supports Markdown)"
              className="w-full h-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all font-mono text-sm leading-relaxed resize-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
