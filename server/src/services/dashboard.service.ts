import { env } from '../config/env';
import { OVERDUE_CHECK_STATE_KEY } from '../constants';
import { dashboardRepository } from '../repositories/dashboard.repository';
import { systemStateRepository } from '../repositories/systemState.repository';
import type { DashboardCounts, DashboardSummary } from '../types/dashboard';
import { runOverdueCheckIfStale } from '../jobs/overdue/overdue.service';
import { cache } from './cache.service';
import { DASHBOARD_CACHE_KEY as CACHE_KEY, dashboardCache } from './dashboardCache';

/** Reported to clients as the X-Cache header so caching is easy to see and test. */
export { dashboardCache };
export type CacheStatus = 'HIT' | 'MISS';

export const dashboardService = {
  /**
   * Redis hit  -> return the cached counts.
   * Redis miss -> count in PostgreSQL, cache for DASHBOARD_CACHE_TTL_SECONDS, return.
   * (If Redis is down the cache layer degrades to a miss, so the endpoint still works.)
   */
  async getSummary(): Promise<{ summary: DashboardSummary; cache: CacheStatus }> {
    await runOverdueCheckIfStale(env.OVERDUE_ON_DEMAND_SECONDS); // no-op when a worker is doing this
    const cached = await cache.get<DashboardCounts>(CACHE_KEY);
    const lastRun = await systemStateRepository.lastUpdatedAt(OVERDUE_CHECK_STATE_KEY);
    const lastOverdueCheckAt = lastRun ? lastRun.toISOString() : null;

    if (cached) return { summary: { ...cached, lastOverdueCheckAt }, cache: 'HIT' };

    const counts = await dashboardRepository.getCounts();
    await cache.set(CACHE_KEY, counts, env.DASHBOARD_CACHE_TTL_SECONDS);
    return { summary: { ...counts, lastOverdueCheckAt }, cache: 'MISS' };
  },
};
