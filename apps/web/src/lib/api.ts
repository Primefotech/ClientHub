import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Track if a 401 redirect is already in progress to avoid loops
let redirecting401 = false;

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request logging
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bb_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });

  // Response logging + 401 handler
  client.interceptors.response.use(
    (response) => {
      console.log(`[API] ✅ ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url;
      const message = error.response?.data?.message || error.message;
      console.error(`[API] ❌ ${status || 'NETWORK_ERROR'} ${url} — ${message}`, error.response?.data);

      // On 401: clear all auth state and redirect to login (only once)
      if (status === 401 && typeof window !== 'undefined' && !redirecting401) {
        // Don't redirect if we're already on the login page
        if (!window.location.pathname.startsWith('/login')) {
          redirecting401 = true;
          console.warn('[API] 401 received — clearing auth and redirecting to login');
          localStorage.removeItem('bb_token');
          localStorage.removeItem('bb_user');
          // Clear the cookie too so middleware doesn't let stale sessions through
          document.cookie = 'bb_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const api = createApiClient();

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/users', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data).then((r) => r.data),
  assignProject: (userId: string, data: any) =>
    api.post(`/users/${userId}/assign-project`, data).then((r) => r.data),
  removeFromProject: (userId: string, projectId: string) =>
    api.delete(`/users/${userId}/project/${projectId}`).then((r) => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};

// ── Tenants ───────────────────────────────────────────────────────────────────
export const tenantsApi = {
  list: (params?: any) => api.get('/tenants', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/tenants/${id}`).then((r) => r.data),
  getStats: (id: string) => api.get(`/tenants/${id}/stats`).then((r) => r.data),
  create: (data: any) => api.post('/tenants', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/tenants/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tenants/${id}`).then((r) => r.data),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data),
  getDashboard: (id: string) => api.get(`/projects/${id}/dashboard`).then((r) => r.data),
  create: (data: any) => api.post('/projects', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
};

// ── Creatives ─────────────────────────────────────────────────────────────────
export const creativesApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/creatives`, { params }).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get(`/projects/${projectId}/creatives/${id}`).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/creatives`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/creatives/${id}`, data).then((r) => r.data),
  updateStatus: (projectId: string, id: string, status: string) =>
    api.patch(`/projects/${projectId}/creatives/${id}/status`, { status }).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/creatives/${id}`).then((r) => r.data),
};

// ── Approvals ─────────────────────────────────────────────────────────────────
export const approvalsApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/approvals`, { params }).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get(`/projects/${projectId}/approvals/${id}`).then((r) => r.data),
  act: (projectId: string, id: string, action: string, comment?: string) =>
    api.post(`/projects/${projectId}/approvals/${id}/act`, { action, comment }).then((r) => r.data),
  getRules: (projectId: string) =>
    api.get(`/projects/${projectId}/approvals/rules`).then((r) => r.data),
  upsertRule: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/approvals/rules`, data).then((r) => r.data),
  lockRule: (projectId: string, ruleId: string) =>
    api.patch(`/projects/${projectId}/approvals/rules/${ruleId}/lock`).then((r) => r.data),
  getAuditLogs: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/approvals/audit-logs`, { params }).then((r) => r.data),
};

// ── CRM ───────────────────────────────────────────────────────────────────────
export const crmApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/crm`, { params }).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get(`/projects/${projectId}/crm/${id}`).then((r) => r.data),
  getStats: (projectId: string) =>
    api.get(`/projects/${projectId}/crm/stats`).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/crm`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/crm/${id}`, data).then((r) => r.data),
};

// ── Communications ────────────────────────────────────────────────────────────
export const commsApi = {
  getThreads: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/communications/threads`, { params }).then((r) => r.data),
  getThread: (projectId: string, threadId: string) =>
    api.get(`/projects/${projectId}/communications/threads/${threadId}`).then((r) => r.data),
  createThread: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/communications/threads`, data).then((r) => r.data),
  addComment: (projectId: string, threadId: string, data: any) =>
    api.post(`/projects/${projectId}/communications/threads/${threadId}/comments`, data).then((r) => r.data),
  resolveThread: (projectId: string, threadId: string) =>
    api.patch(`/projects/${projectId}/communications/threads/${threadId}/resolve`).then((r) => r.data),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/reports`, { params }).then((r) => r.data),
  getAggregated: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/reports/aggregated`, { params }).then((r) => r.data),
  getTimeSeries: (projectId: string, dateFrom: string, dateTo: string) =>
    api.get(`/projects/${projectId}/reports/time-series`, { params: { dateFrom, dateTo } }).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/reports`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/reports/${id}`, data).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/reports/${id}`).then((r) => r.data),
  getGlobalDashboard: () => api.get('/global-reports/dashboard').then((r) => r.data),
  getStaffPerformance: () => api.get('/global-reports/staff-performance').then((r) => r.data),
};

// ── Onboarding ────────────────────────────────────────────────────────────────
export const onboardingApi = {
  getForms: (projectId: string) =>
    api.get(`/projects/${projectId}/onboarding`).then((r) => r.data),
  getForm: (projectId: string, id: string) =>
    api.get(`/projects/${projectId}/onboarding/${id}`).then((r) => r.data),
  createForm: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/onboarding`, data).then((r) => r.data),
  addField: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/onboarding/fields`, data).then((r) => r.data),
  submitResponses: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/onboarding/responses`, data).then((r) => r.data),
  publishForm: (projectId: string, id: string) =>
    api.patch(`/projects/${projectId}/onboarding/${id}/publish`).then((r) => r.data),
  unpublishForm: (projectId: string, id: string) =>
    api.patch(`/projects/${projectId}/onboarding/${id}/unpublish`).then((r) => r.data),
  deleteForm: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/onboarding/${id}`).then((r) => r.data),
};

// ── Calendar ──────────────────────────────────────────────────────────────────
export const calendarApi = {
  getEvents: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/calendar`, { params }).then((r) => r.data),
  getMonthView: (projectId: string, year: number, month: number) =>
    api.get(`/projects/${projectId}/calendar/month/${year}/${month}`).then((r) => r.data),
  createEvent: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/calendar`, data).then((r) => r.data),
  updateEvent: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/calendar/${id}`, data).then((r) => r.data),
  deleteEvent: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/calendar/${id}`).then((r) => r.data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

// ── Content Types ─────────────────────────────────────────────────────────────
export const contentTypesApi = {
  list: (params?: any) => api.get('/content-types', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/content-types/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/content-types', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/content-types/${id}`, data).then((r) => r.data),
  archive: (id: string) => api.patch(`/content-types/${id}/archive`).then((r) => r.data),
  restore: (id: string) => api.patch(`/content-types/${id}/restore`).then((r) => r.data),
  delete: (id: string) => api.delete(`/content-types/${id}`).then((r) => r.data),
};

// ── Upsell ────────────────────────────────────────────────────────────────────
export const upsellApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/upsell`, { params }).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/upsell`, data).then((r) => r.data),
  updateStatus: (projectId: string, id: string, status: string) =>
    api.patch(`/projects/${projectId}/upsell/${id}/status`, { status }).then((r) => r.data),
  markViewed: (projectId: string, id: string) =>
    api.patch(`/projects/${projectId}/upsell/${id}/viewed`).then((r) => r.data),
};

// ── Rule Engine ───────────────────────────────────────────────────────────────
export const ruleEngineApi = {
  getAllConfigs: (projectId: string) =>
    api.get(`/projects/${projectId}/rules`).then((r) => r.data),
  getConfig: (projectId: string, module: string) =>
    api.get(`/projects/${projectId}/rules/${module}`).then((r) => r.data),
  upsertConfig: (projectId: string, module: string, rules: any[]) =>
    api.post(`/projects/${projectId}/rules/${module}`, { rules }).then((r) => r.data),
  lockConfig: (projectId: string, module: string) =>
    api.patch(`/projects/${projectId}/rules/${module}/lock`).then((r) => r.data),
};

export const settingsApi = {
  getAll: () => api.get('/settings').then((r) => r.data),
  updateAll: (data: any) => api.patch('/settings', data).then((r) => r.data),
};

export const adminUpsellApi = {
  list: (params?: any) => api.get('/global-upsell', { params }).then((r) => r.data),
  create: (data: any) => api.post('/global-upsell', data).then((r) => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/global-upsell/${id}/status`, { status }).then((r) => r.data),
  delete: (id: string) => api.delete(`/global-upsell/${id}`).then((r) => r.data),
};

export const globalOnboardingApi = {
  getForms: () => api.get('/global-onboarding').then((r) => r.data),
  createForm: (data: any) => api.post('/global-onboarding', data).then((r) => r.data),
  addField: (formId: string, data: any) => api.post(`/global-onboarding/${formId}/fields`, data).then((r) => r.data),
};
// ── Playbooks ─────────────────────────────────────────────────────────────────
export const playbooksApi = {
  list: () => api.get('/playbooks').then((r) => r.data),
  get: (slug: string) => api.get(`/playbooks/${slug}`).then((r) => r.data),
  upsert: (data: any) => api.post('/playbooks', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/playbooks/${id}`).then((r) => r.data),
};
