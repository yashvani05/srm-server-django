import { Queue, type ConnectionOptions } from 'bullmq';
import { redisOptions } from '../../config/redis';

export const OVERDUE_QUEUE_NAME = 'overdue-check';
export const OVERDUE_JOB_NAME = 'check-overdue';

/** BullMQ needs its own Redis connection with `maxRetriesPerRequest: null` (blocking commands must not time out). */
export const bullConnection = redisOptions({ maxRetriesPerRequest: null }) as ConnectionOptions;

let queue: Queue | undefined;

/**
 * The queue is created on first use, not on import. A serverless function that never touches the queue
 * (like the API on Vercel) therefore never opens a BullMQ connection.
 */
export function getOverdueQueue(): Queue {
  queue ??= new Queue(OVERDUE_QUEUE_NAME, {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 3, // a transient failure (DB blip) is retried before the job is marked failed
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 50 }, // keep a short history for debugging, don't let Redis grow forever
      removeOnFail: { count: 100 },
    },
  });
  return queue;
}

export async function closeOverdueQueue(): Promise<void> {
  await queue?.close();
  queue = undefined;
}
