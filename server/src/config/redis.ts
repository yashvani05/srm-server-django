import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/** Connection options from REDIS_URL (hosted Redis, `rediss://` enables TLS) or from REDIS_HOST / REDIS_PORT. */
export function redisOptions(overrides: RedisOptions = {}): RedisOptions {
  if (env.REDIS_URL) {
    const url = new URL(env.REDIS_URL);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      ...overrides,
    };
  }
  return { host: env.REDIS_HOST, port: env.REDIS_PORT, ...overrides };
}

const target = () => (env.REDIS_URL ? new URL(env.REDIS_URL).host : `${env.REDIS_HOST}:${env.REDIS_PORT}`);

// Shared client for caching and the JWT denylist. (BullMQ gets its own connection.)
export const redis = new Redis(redisOptions({ maxRetriesPerRequest: 2 }));

redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));

export async function connectRedis(): Promise<void> {
  await redis.ping();
  logger.info(`Redis connected (${target()})`);
}
