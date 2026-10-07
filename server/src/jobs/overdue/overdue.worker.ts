import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { OVERDUE_QUEUE_NAME, bullConnection } from './overdue.queue';
import { runOverdueCheck } from './overdue.service';

/** Processes overdue-check jobs, one at a time, so two checks never overlap. */
export function createOverdueWorker(): Worker {
  const worker = new Worker(OVERDUE_QUEUE_NAME, async () => runOverdueCheck(), { connection: bullConnection, concurrency: 1, drainDelay: env.BULLMQ_DRAIN_DELAY_SECONDS });

  worker.on('completed', (job) => logger.info({ jobId: job.id, result: job.returnvalue }, 'Overdue job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, attempt: job?.attemptsMade, err: err.message }, 'Overdue job failed'));
  worker.on('error', (err) => logger.error({ err: err.message }, 'Overdue worker error'));
  return worker;
}
