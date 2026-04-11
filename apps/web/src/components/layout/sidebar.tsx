'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, canAccessModule } from '@/lib/auth';
import {
  LayoutDashboard, Users, Building2, FolderKanban, Image, CheckSquare,
  Users2, MessageSquare, BarChart3, ClipboardList, Calendar,
  Settings, TrendingUp, Briefcase, Zap, BookOpen, ChevronDown, LogOut, Sparkles, Monitor, Archive
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: string;
  badge?: number;
}

interface SidebarProps {
  user: User;
  projectId?: string;
  projects?: Array<{ id: string; name: string; color?: string; icon?: string; service?: { hasWebDev?: boolean } }>;
  activeProject?: any;
  onLogout: () => void;
}

const getAdminNav = (): NavItem[] => [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Tenants', href: '/admin/tenants', icon: <Building2 className="w-4 h-4" />, module: 'admin' },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" />, module: 'admin' },
  { label: 'Services', href: '/admin/services', icon: <Briefcase className="w-4 h-4" />, module: 'admin' },
  { label: 'Content Types', href: '/admin/content-types', icon: <FolderKanban className="w-4 h-4" />, module: 'content-types' },
  { label: 'Onboarding', href: '/admin/onboarding', icon: <ClipboardList className="w-4 h-4" />, module: 'admin' },
  { label: 'Upsells', href: '/admin/upsell', icon: <TrendingUp className="w-4 h-4" />, module: 'admin' },
  { label: 'Reports', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" />, module: 'admin' },
  { label: 'Archive', href: '/admin/archive', icon: <Archive className="w-4 h-4" />, module: 'admin' },
  { label: 'Playbook', href: '/admin/playbook', icon: <BookOpen className="w-4 h-4" />, module: 'admin' },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" />, module: 'admin' },
];

const getProjectNav = (projectId: string, hasWebDev?: boolean): NavItem[] => [
  { label: 'Dashboard', href: `/projects/${projectId}`, icon: <LayoutDashboard className="w-4 h-4" /> },
  // Show Web Design & Dev OR Creatives based on service type
  ...(hasWebDev
    ? [{ label: 'Web Design & Dev', href: `/projects/${projectId}/webdev`, icon: <Monitor className="w-4 h-4" />, module: 'creatives' }]
    : [{ label: 'Creatives', href: `/projects/${projectId}/creatives`, icon: <Image className="w-4 h-4" />, module: 'creatives' }]
  ),
  { label: 'Approvals', href: `/projects/${projectId}/approvals`, icon: <CheckSquare className="w-4 h-4" />, module: 'approvals' },
  { label: 'Calendar', href: `/projects/${projectId}/calendar`, icon: <Calendar className="w-4 h-4" />, module: 'calendar' },
  { label: 'CRM', href: `/projects/${projectId}/crm`, icon: <Users2 className="w-4 h-4" />, module: 'crm' },
  { label: 'Communications', href: `/projects/${projectId}/communications`, icon: <MessageSquare className="w-4 h-4" />, module: 'communications' },
  { label: 'Reports', href: `/projects/${projectId}/reports`, icon: <BarChart3 className="w-4 h-4" />, module: 'reports' },
  { label: 'Onboarding', href: `/projects/${projectId}/onboarding`, icon: <ClipboardList className="w-4 h-4" />, module: 'onboarding' },
  { label: 'Recommended Services', href: `/projects/${projectId}/upsell`, icon: <Sparkles className="w-4 h-4" />, module: 'upsell' },
  { label: 'Playbook', href: `/projects/${projectId}/playbook`, icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="w-4 h-4" />, module: 'settings' },
];

export function Sidebar({ user, projectId, projects = [], activeProject, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const adminNav = getAdminNav();
  const resolvedActiveProject = activeProject || (projectId ? projects.find(p => p.id === projectId) : null);
  const hasWebDev = resolvedActiveProject?.service?.hasWebDev === true;
  const projectNav = projectId ? getProjectNav(projectId, hasWebDev) : [];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const navItem = ({ label, href, icon, module: mod }: NavItem) => {
    if (mod && !canAccessModule(user, mod, projectId, resolvedActiveProject)) return null;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive(href)
            ? 'bg-brandbook-500/15 text-brandbook-600 font-semibold'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        )}
      >
        <span className={isActive(href) ? 'text-brandbook-500' : 'text-gray-400'}>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brandbook-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none text-sm">BrandBook</p>
            <p className="text-xs text-gray-500 mt-0.5">Client OS</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Admin section */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">Admin</p>
            {adminNav.map(navItem)}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
            >
              Projects
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !projectsExpanded && '-rotate-90')} />
            </button>

            {projectsExpanded && (
              <div className="space-y-0.5 mt-1">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                      pathname.includes(`/projects/${p.id}`)
                        ? 'bg-brandbook-500/10 text-brandbook-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: p.color ? `${p.color}20` : '#e0e7ff' }}
                    >
                      {p.icon || '📁'}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Project module nav */}
        {projectId && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">Project Workspace</p>
            {projectNav.map(navItem)}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-brandbook-100 flex items-center justify-center flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-brandbook-600">
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
