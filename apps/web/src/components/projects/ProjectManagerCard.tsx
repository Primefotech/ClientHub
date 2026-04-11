'use client';

import { Calendar, Mail, MessageSquare, ExternalLink } from 'lucide-react';

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface ProjectManagerCardProps {
  manager: ProjectManager;
  schedulingUrl?: string;
}

export function ProjectManagerCard({ manager, schedulingUrl }: ProjectManagerCardProps) {
  if (!manager) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <div className="w-16 h-16 rounded-2xl bg-brandbook-500 overflow-hidden shadow-lg shadow-brandbook-500/20">
            {manager.avatar ? (
              <img src={manager.avatar} alt={manager.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white uppercase">
                {manager.name.substring(0, 2)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-bold text-brandbook-500 uppercase tracking-widest mb-0.5">Your Project Manager</p>
          <h4 className="text-xl font-bold text-gray-900 leading-none">{manager.name}</h4>
          <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tighter">
            {manager.role?.replace('_', ' ') || 'PROJECT HEAD'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100/50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Availability</p>
          <p className="text-xs font-bold text-gray-900">Mon - Fri, 9am - 6pm</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100/50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Response Time</p>
          <p className="text-xs font-bold text-gray-900">&lt; 2 Hours</p>
        </div>
      </div>

      <div className="space-y-3">
        <a 
          href={schedulingUrl || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-3 bg-brandbook-500 hover:bg-brandbook-600 text-white rounded-xl font-bold text-sm shadow-md shadow-brandbook-500/20 transition-all flex items-center justify-center gap-2 group"
        >
          <Calendar className="w-4 h-4" />
          Schedule Strategy Call
          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        
        <div className="flex gap-2">
          <a 
            href={`mailto:${manager.email}`}
            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs border border-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
          <button 
            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs border border-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live Chat
          </button>
        </div>
      </div>
    </div>
  );
}
