'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/sidebar';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);

  // Extract projectId from URL
  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch?.[1];

  useEffect(() => {
    // Only redirect when loading is fully complete AND there's no user
    if (!loading && !user) {
      console.warn('[DashboardLayout] No user after loading complete, redirecting to login');
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      console.log('[DashboardLayout] Loading projects for user:', user.email);
      projectsApi
        .list()
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          console.log('[DashboardLayout] Projects loaded:', list.length);
          setProjects(list);
        })
        .catch((err) => {
          console.error('[DashboardLayout] Failed to load projects:', err?.response?.status, err?.message);
        });
    }
  }, [user]);

  // Show loading spinner while auth is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brandbook-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // If not loading but no user, show nothing (redirect is happening)
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        user={user}
        projectId={projectId}
        projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color, icon: p.icon }))}
        onLogout={logout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
