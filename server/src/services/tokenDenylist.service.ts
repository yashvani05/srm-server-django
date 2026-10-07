import { redis } from '../config/redis';

const key = (jti: string) => `auth:denylist:${jti}`;

export const tokenDenylist = {
  /** Deny a token until it would have expired anyway, so the list cleans itself up. */
  async deny(jti: string, expiresAtUnixSeconds: number): Promise<void> {
    const ttl = expiresAtUnixSeconds - Math.floor(Date.now() / 1000);
    if (ttl > 0) await redis.set(key(jti), '1', 'EX', ttl);
  },

  async isDenied(jti: string): Promise<boolean> {
    return (await redis.exists(key(jti))) === 1;
  },
};
