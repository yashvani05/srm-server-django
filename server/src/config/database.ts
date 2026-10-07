import { Sequelize, type Options } from 'sequelize';
import { env } from './env';
import { logger } from '../utils/logger';

// Options shared by local and hosted databases. The pool is kept small on purpose: on serverless hosts every
// function instance opens its own connections, so a large pool would exhaust a hosted database quickly.
const common: Options = {
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? (sql) => logger.debug(sql) : false,
  define: { underscored: true },
  pool: { max: env.DB_POOL_MAX, min: 0, idle: 10_000, acquire: 30_000 },
  dialectOptions: env.DB_SSL ? { ssl: { require: true } } : {},
};

// Schema is owned by migrations. Never call sequelize.sync() here.
export const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, common)
  : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD || undefined, { ...common, host: env.DB_HOST, port: env.DB_PORT });

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  const target = env.DATABASE_URL ? new URL(env.DATABASE_URL).host : `${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
  logger.info(`PostgreSQL connected (${target})`); // never log the full URL: it contains the password
}
