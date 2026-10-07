import { cache } from './cache.service';

export const DASHBOARD_CACHE_KEY = 'dashboard:summary';

export const dashboardCache = {
  /** Called after anything that changes the counts (create, edit, delete, status change, overdue check). */
  invalidate: () => cache.del(DASHBOARD_CACHE_KEY),
};
