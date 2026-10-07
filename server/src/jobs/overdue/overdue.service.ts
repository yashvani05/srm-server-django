import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { OVERDUE_CHECK_STATE_KEY } from '../../constants';
import { OVERDUE_CONDITION } from '../../repositories/overdue.sql';
import { systemStateRepository } from '../../repositories/systemState.repository';
import { env } from '../../config/env';
import { dashboardCache } from '../../services/dashboardCache';
import { logger } from '../../utils/logger';

export interface OverdueCheckResult {
  /** Requests newly flagged overdue by this run. */
  marked: number;
  /** Requests whose stale overdue flag was cleared by this run. */
  cleared: number;
  durationMs: number;
}

/**
 * One overdue check. Idempotent: it only touches rows whose flag is wrong, so running it again (or twice at once)
 * changes nothing the second time.
 *
 * Everything happens in ONE transaction, including recording the last-success time, so a run that fails part-way
 * rolls back completely and never records a success.
 */
export async function runOverdueCheck(): Promise<OverdueCheckResult> {
  const startedAt = Date.now();

  const { marked, cleared } = await sequelize.transaction(async (transaction) => {
    // 1. Flag requests that have now been OPEN / IN_PROGRESS for more than 24h and are not flagged yet.
    const [, marked] = await sequelize.query(
      `UPDATE service_requests SET overdue = true, overdue_at = now() WHERE overdue = false AND ${OVERDUE_CONDITION}`,
      { type: QueryTypes.UPDATE, transaction },
    );
    // 2. Safety net: nothing may stay flagged unless it still qualifies (e.g. RESOLVED rows are never overdue).
    //    Normal status changes already clear the flag synchronously; this heals any row that slipped through.
    const [, cleared] = await sequelize.query(
      `UPDATE service_requests SET overdue = false, overdue_at = NULL WHERE overdue = true AND NOT ${OVERDUE_CONDITION}`,
      { type: QueryTypes.UPDATE, transaction },
    );
    // 3. Record success (same transaction => only committed if the work above committed).
    await systemStateRepository.touch(OVERDUE_CHECK_STATE_KEY, 'ok', transaction);
    return { marked, cleared };
  });

  // The dashboard's overdue count just changed, so drop the cached summary (after commit).
  if (marked + cleared > 0) await dashboardCache.invalidate();

  const result = { marked, cleared, durationMs: Date.now() - startedAt };
  logger.info(result, 'Overdue check finished');
  return result;
}

let inFlight: Promise<unknown> | null = null;

/**
 * For hosts with no background worker (e.g. Vercel): run the check from the API when the last successful run is
 * older than `maxAgeSeconds`. Safe to call from anywhere and from many requests at once, because the check is
 * idempotent; concurrent calls inside one instance share a single run. Never breaks the page that called it.
 * `maxAgeSeconds = 0` turns it off (the normal setup, where the worker does this).
 */
export async function runOverdueCheckIfStale(maxAgeSeconds: number): Promise<void> {
  if (maxAgeSeconds <= 0) return;
  try {
    const last = await systemStateRepository.lastUpdatedAt(OVERDUE_CHECK_STATE_KEY);
    if (last && Date.now() - last.getTime() < maxAgeSeconds * 1000) return;
    inFlight ??= runOverdueCheck().finally(() => (inFlight = null));
    await inFlight;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'On-demand overdue check failed; continuing with current flags');
  }
}
