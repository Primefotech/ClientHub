'use client';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { BookOpen, HelpCircle, CheckCircle2, MessageSquare, Briefcase, FileSignature, Activity, Loader2, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { playbooksApi } from '@/lib/api';

export default function ProjectPlaybookPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT_OWNER' || user?.role === 'CLIENT_STAFF';

  const { data: playbook, isLoading } = useQuery({
    queryKey: ['playbook', 'client-playbook'],
    queryFn: () => playbooksApi.get('client-playbook').catch(() => null),
  });

  const customText = playbook?.content?.text;

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/50">
      <Header
        user={user!}
        title="Project Playbook"
        subtitle="Your guide to working within the BrandBook ecosystem"
      />

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8 pb-12">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-110" />
          <BookOpen className="w-12 h-12 text-indigo-100 mb-6 relative z-10" />
          <h1 className="text-3xl font-black mb-3 relative z-10">Welcome to {isClient ? 'your' : 'the'} Workspace Guide</h1>
          <p className="text-indigo-100 max-w-2xl text-base leading-relaxed relative z-10 font-medium opacity-90">
            The standard operating rhythm for interactions, reviews, and high-velocity production. Review the core steps below.
          </p>
        </div>

        {isLoading ? (
           <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
           </div>
        ) : customText ? (
           /* Custom Database Content Rendering */
           <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
              <div className="flex items-center gap-2 mb-8 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full w-fit">
                 <Info className="w-3.5 h-3.5" />
                 Last updated: {new Date(playbook.updatedAt).toLocaleDateString()}
              </div>
              <div className="prose prose-indigo max-w-none whitespace-pre-wrap text-gray-600 leading-loose text-lg font-medium">
                 {customText}
              </div>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
             <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all group">
               <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                 <FileSignature className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-3">1. Complete Onboarding</h3>
               <p className="text-sm text-gray-500 mb-6">Initial setup and brief completion guides.</p>
               <ul className="space-y-4">
                 {[
                   "Navigate to the Onboarding tab.",
                   "Locate assigned Intake Forms.",
                   "Submit requirements for production team review."
                 ].map((s, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                     <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                     <span>{s}</span>
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all group">
               <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                 <CheckCircle2 className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-3">2. Review Content</h3>
               <p className="text-sm text-gray-500 mb-6">Approving staged production creatives.</p>
               <ul className="space-y-4">
                 {[
                   "Access Approvals tab routinely.",
                   "Review deadline constraints carefully.",
                   "Request revisions via specific asset threads."
                 ].map((s, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                     <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                     <span>{s}</span>
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all group">
               <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                 <MessageSquare className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-3">3. Direct Chat</h3>
               <p className="text-sm text-gray-500 mb-6">Engaging with the production core team.</p>
               <ul className="space-y-4">
                 {[
                   "Visit Threads for generalized strategy.",
                   "@Mention leads for priority notifications.",
                   "Drop reference files directly into chat."
                 ].map((s, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                     <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                     <span>{s}</span>
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all group">
               <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                 <Briefcase className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-3">4. Scale Services</h3>
               <p className="text-sm text-gray-500 mb-6">Packaged add-ons and tier expansions.</p>
               <ul className="space-y-4">
                 {[
                   "Browse the Upsells catalog for extras.",
                   "Signal interest with a single click.",
                   "Automatic provisioning by Project Head."
                 ].map((s, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                     <span>{s}</span>
                   </li>
                 ))}
               </ul>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
