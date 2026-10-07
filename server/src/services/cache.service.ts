import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * JSON cache on Redis. Caching is an optimisation, never a dependency: if Redis is unavailable every
 * method degrades gracefully (reads miss, writes and deletes are skipped with a warning).
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (err) {
      logger.warn({ err: (err as Error).message, key }, 'Cache read failed; falling back to the database');
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn({ err: (err as Error).message, key }, 'Cache write failed');
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn({ err: (err as Error).message, key }, 'Cache invalidation failed; entry will expire via its TTL');
    }
  },
};
