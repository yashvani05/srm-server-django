// Background worker process: `npm run worker`. Deliberately separate from the HTTP API (src/server.ts) so job
// processing can be started, stopped and scaled independently of web traffic.
import { connectDatabase, sequelize } from './config/database';
import { connectRedis, redis } from './config/redis';
import { closeOverdueQueue } from './jobs/overdue/overdue.queue';
import { createOverdueWorker } from './jobs/overdue/overdue.worker';
import { registerOverdueSchedule } from './jobs/scheduler';
import './models';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const worker = createOverdueWorker();
  await registerOverdueSchedule();
  logger.info('Worker started; waiting for jobs');

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down worker`);
    await worker.close(); // lets a running job finish
    await closeOverdueQueue();
    await sequelize.close();
    redis.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start worker');
  process.exit(1);
});
