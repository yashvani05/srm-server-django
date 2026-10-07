export const REQUEST_CATEGORIES = ['IT', 'MAINTENANCE', 'GENERAL'] as const;
export const REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const REQUEST_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ROLES = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' } as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  REQUESTS_READ: 'requests.read',
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_UPDATE: 'requests.update',
  REQUESTS_DELETE: 'requests.delete',
  REQUESTS_STATUS_UPDATE: 'requests.status.update',
  DASHBOARD_READ: 'dashboard.read',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** A request is overdue once it has been OPEN or IN_PROGRESS for longer than this. */
export const OVERDUE_AFTER_HOURS = 24;

/** system_state key under which the overdue worker records its last successful run. */
export const OVERDUE_CHECK_STATE_KEY = 'overdue_check.last_success_at';
