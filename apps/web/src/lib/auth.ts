import { User } from '@/types';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bb_token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('bb_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem('bb_token', token);
  localStorage.setItem('bb_user', JSON.stringify(user));
  // Set cookie for middleware
  document.cookie = `bb_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuth() {
  localStorage.removeItem('bb_token');
  localStorage.removeItem('bb_user');
  // Clear cookie
  document.cookie = 'bb_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function hasRole(user: User | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function hasPermission(
  user: User | null,
  projectId: string | undefined,
  module: string,
  action: 'read' | 'create' | 'update' | 'delete' = 'read'
): boolean {
  if (!user) return false;
  
  // Super Admin can do everything. Admin module is only for Super Admin.
  if (user.role === 'SUPER_ADMIN') return true;
  if (module === 'admin') return false;

  // Base role-based defaults explicitly defining CRUD.
  const defaultAccess: Record<string, Record<string, ('read'|'create'|'update'|'delete')[]>> = {
    PROJECT_HEAD: {
      'content-types': ['read', 'create', 'update', 'delete'],
      creatives: ['read', 'create', 'update', 'delete'],
      approvals: ['read', 'create', 'update', 'delete'],
      crm: ['read', 'create', 'update', 'delete'],
      communications: ['read', 'create', 'update', 'delete'],
      reports: ['read', 'create', 'update', 'delete'],
      onboarding: ['read', 'create', 'update', 'delete'],
      calendar: ['read', 'create', 'update', 'delete'],
      upsell: ['read', 'create', 'update', 'delete'],
      settings: ['read', 'create', 'update', 'delete'],
      'rule-engine': ['read', 'create', 'update', 'delete'],
    },
    BRANDBOOK_STAFF: {
      creatives: ['read', 'create', 'update'],
      crm: ['read', 'create', 'update'],
      communications: ['read', 'create'],
      reports: ['read', 'create'],
      calendar: ['read', 'create'],
      upsell: ['read', 'create'],
    },
    CLIENT_OWNER: {
      creatives: ['read'],
      approvals: ['read', 'create'],
      crm: ['read'],
      communications: ['read', 'create'],
      reports: ['read'],
      onboarding: ['read', 'update'],
      calendar: ['read'],
      upsell: ['read'],
    },
    CLIENT_STAFF: {
      crm: ['read', 'create'],
      communications: ['read'],
    }
  };

  let allowed = defaultAccess[user.role]?.[module]?.includes(action) ?? false;

  // Override defaults with explicit project-level permissions if defined
  if (projectId && (user as any).projectUsers) {
    const pu = (user as any).projectUsers.find((p: any) => p.projectId === projectId);
    if (pu?.permissions && pu.permissions[module]) {
      // If a permission array exists for this module, it overrides the default
      allowed = pu.permissions[module].includes(action);
    }
  }

  return allowed;
}

export function canAccessModule(user: User | null, module: string, projectId?: string, project?: any): boolean {
  // First check role/permission based access
  const hasBaseAccess = hasPermission(user, projectId, module, 'read');
  if (!hasBaseAccess) return false;

  // If project data is provided, check if the Service allows this module
  if (project?.service) {
    const service = project.service;
    if (module === 'crm' && !service.hasCRM) return false;
    if (module === 'calendar' && !service.hasCalendar) return false;
    if (module === 'reports' && !service.hasAdReporting) return false;
    if (module === 'webdev' && !service.hasWebDev) return false;
  }

  return true;
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROJECT_HEAD: 'Project Head',
  BRANDBOOK_STAFF: 'BrandBook Staff',
  CLIENT_OWNER: 'Client Owner',
  CLIENT_STAFF: 'Client Staff',
};

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  PROJECT_HEAD: 'bg-purple-100 text-purple-800',
  BRANDBOOK_STAFF: 'bg-blue-100 text-blue-800',
  CLIENT_OWNER: 'bg-green-100 text-green-800',
  CLIENT_STAFF: 'bg-gray-100 text-gray-800',
};
