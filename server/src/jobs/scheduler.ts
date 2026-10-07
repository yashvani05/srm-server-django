import { env } from '../config/env';
import { logger } from '../utils/logger';
import { OVERDUE_JOB_NAME, getOverdueQueue } from './overdue/overdue.queue';

const SCHEDULE_ID = 'overdue-check-schedule';

/**
 * Registers the repeating overdue check. `upsertJobScheduler` is idempotent: restarting the worker (or running
 * several) updates the one schedule instead of stacking duplicates.
 */
export async function registerOverdueSchedule(): Promise<void> {
  const overdueQueue = getOverdueQueue();
  await overdueQueue.upsertJobScheduler(SCHEDULE_ID, { every: env.OVERDUE_CHECK_INTERVAL_MS }, { name: OVERDUE_JOB_NAME, data: { trigger: 'schedule' } });
  // Also run once right away so flags are fresh the moment the worker starts, instead of after the first interval.
  await overdueQueue.add(OVERDUE_JOB_NAME, { trigger: 'startup' });
  logger.info({ everyMs: env.OVERDUE_CHECK_INTERVAL_MS }, 'Overdue check scheduled');
}
