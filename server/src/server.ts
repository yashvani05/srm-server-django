import { env } from './config/env';
import { connectDatabase, sequelize } from './config/database';
import { connectRedis, redis } from './config/redis';
import './models';
import { createApp } from './app';
import { closeOverdueQueue } from './jobs/overdue/overdue.queue';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await sequelize.close();
      await closeOverdueQueue();
      redis.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
