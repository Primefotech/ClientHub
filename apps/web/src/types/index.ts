export type Role = 'SUPER_ADMIN' | 'PROJECT_HEAD' | 'BRANDBOOK_STAFF' | 'CLIENT_OWNER' | 'CLIENT_STAFF';

export type ContentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'AUTO_APPROVED';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' | 'ON_HOLD';

export type ApprovalAction = 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'AUTO_APPROVED' | 'DEADLINE_PASSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenantUsers?: TenantUser[];
  projectUsers?: ProjectUser[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  domain?: string;
  industry?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { tenantUsers: number; projects: number };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  tenant: Pick<Tenant, 'id' | 'name' | 'slug' | 'logo'>;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, 'id' | 'name' | 'slug' | 'logo'>;
  projectUsers?: ProjectUser[];
  _count?: Record<string, number>;
}

export interface ProjectUser {
  id: string;
  projectId: string;
  userId: string;
  role: Role;
  permissions: Record<string, any>;
  project?: Pick<Project, 'id' | 'name' | 'status' | 'color' | 'icon'>;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
}

export interface ContentType {
  id: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  projectId?: string;
  fields: any[];
  defaultApprovalRequired: boolean;
  defaultAutoApprove: boolean;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Creative {
  id: string;
  projectId: string;
  contentTypeId?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType: string;
  status: ContentStatus;
  requiresApproval: boolean;
  scheduledAt?: string;
  tags: string[];
  versionNumber: number;
  isLatestVersion: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: Pick<User, 'id' | 'name' | 'avatar'>;
  contentType?: Pick<ContentType, 'id' | 'name' | 'icon' | 'color'>;
  approvalRequests?: ApprovalRequest[];
  _count?: { versions: number; threads: number };
}

export interface ApprovalRequest {
  id: string;
  creativeId: string;
  status: ContentStatus;
  deadline?: string;
  notes?: string;
  round: number;
  createdAt: string;
  creative?: Creative;
  approvalLogs?: ApprovalLog[];
}

export interface ApprovalLog {
  id: string;
  approvalRequestId: string;
  action: ApprovalAction;
  comment?: string;
  timeTakenMinutes?: number;
  createdAt: string;
  actionBy?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface ApprovalRule {
  id: string;
  projectId: string;
  name: string;
  requiresApproval: boolean;
  approvalDeadlineHours?: number;
  autoApproveAfterDeadline: boolean;
  requiresClientApproval: boolean;
  isLocked: boolean;
  priority: number;
}

export interface Thread {
  id: string;
  projectId: string;
  creativeId?: string;
  title?: string;
  type: string;
  isResolved: boolean;
  createdAt: string;
  createdBy?: Pick<User, 'id' | 'name' | 'avatar'>;
  creative?: Pick<Creative, 'id' | 'title' | 'fileType' | 'thumbnailUrl'>;
  comments?: Comment[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  threadId: string;
  content: string;
  attachments: string[];
  mentions: string[];
  isEdited: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  replies?: Comment[];
}

export interface CRMLead {
  id: string;
  projectId: string;
  source: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  assignedToId?: string;
  notes?: string;
  customFields: Record<string, any>;
  tags: string[];
  value?: number;
  currency: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: Pick<User, 'id' | 'name' | 'avatar'>;
  _count?: { history: number };
}

export interface AdReport {
  id: string;
  projectId: string;
  platform: string;
  campaignName?: string;
  dateFrom: string;
  dateTo: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
  cpl?: number;
  cpc?: number;
  ctr?: number;
  roas?: number;
  createdAt: string;
}

export interface OnboardingForm {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  mode: 'CLIENT_FILLED' | 'PH_FILLED';
  isPublished: boolean;
  shareToken?: string;
  fields?: OnboardingField[];
  _count?: { responses: number };
}

export interface OnboardingField {
  id: string;
  formId: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  options: any[];
  order: number;
  sectionLabel?: string;
  responses?: { value?: string; fileUrl?: string }[];
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  creativeId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  color?: string;
  status: string;
  platform?: string;
  creative?: Pick<Creative, 'id' | 'title' | 'status' | 'fileType' | 'thumbnailUrl'>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UpsellRecommendation {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimatedValue?: number;
  currency: string;
  createdAt: string;
  createdBy?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, any>;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DashboardStats {
  pendingApprovals: number;
  totalCreatives: number;
  recentLeads: number;
  upcomingEvents: number;
  totalSpend: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  recentActivity: ActivityLog[];
}
