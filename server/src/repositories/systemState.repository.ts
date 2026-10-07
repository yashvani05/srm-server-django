import { QueryTypes, type Transaction } from 'sequelize';
import { sequelize } from '../config/database';

/** Tiny key/value store (table `system_state`) for facts about the system itself, e.g. when a job last succeeded. */
export const systemStateRepository = {
  /** Records `key` as written "now" (database clock). Pass the job's transaction so it commits atomically with the job's work. */
  async touch(key: string, value: string, transaction?: Transaction): Promise<void> {
    await sequelize.query(
      `INSERT INTO system_state (key, value, updated_at) VALUES (:key, :value, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      { replacements: { key, value }, transaction },
    );
  },

  /** When `key` was last written, or null if it never was. */
  async lastUpdatedAt(key: string): Promise<Date | null> {
    const rows = await sequelize.query<{ updated_at: Date }>('SELECT updated_at FROM system_state WHERE key = :key', {
      replacements: { key },
      type: QueryTypes.SELECT,
    });
    return rows[0]?.updated_at ?? null;
  },
};
