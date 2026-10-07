import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config({ quiet: true });

interface Env {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  CORS_ORIGIN: string;
  DB_HOST: string;
  DB_PORT: number;
  /** Full connection string (hosted PostgreSQL such as Neon). When set it replaces DB_HOST/PORT/NAME/USER/PASSWORD. */
  DATABASE_URL?: string;
  DB_SSL: boolean;
  DB_POOL_MAX: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  /** Full connection string (hosted Redis such as Upstash, `rediss://` = TLS). When set it replaces REDIS_HOST/PORT. */
  REDIS_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOGIN_RATE_LIMIT_MAX: number;
  /** Number of reverse-proxy hops to trust for the client IP (1 on Vercel). */
  TRUST_PROXY: number;
  ENABLE_BULL_BOARD: boolean;
  /** Run the overdue check from the API when it is older than this many seconds (0 = off). For hosts with no worker, e.g. Vercel. */
  OVERDUE_ON_DEMAND_SECONDS: number;
  /** Shared secret for the cron endpoint that runs the overdue check (endpoint is disabled when unset). */
  CRON_SECRET?: string;
  BULLMQ_DRAIN_DELAY_SECONDS: number;
  OVERDUE_CHECK_INTERVAL_MS: number;
  DASHBOARD_CACHE_TTL_SECONDS: number;
  SWAGGER_USER: string;
  SWAGGER_PASS: string;
}

const schema = Joi.object<Env>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  DB_SSL: Joi.boolean().default(false),
  DB_POOL_MAX: Joi.number().integer().min(1).default(5),
  // Required only when DATABASE_URL is not used.
  DB_NAME: Joi.when('DATABASE_URL', { is: Joi.exist(), then: Joi.string().allow('').default(''), otherwise: Joi.string().required() }),
  DB_USER: Joi.when('DATABASE_URL', { is: Joi.exist(), then: Joi.string().allow('').default(''), otherwise: Joi.string().required() }),
  DB_PASSWORD: Joi.string().allow('').default(''),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  LOGIN_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(10),
  TRUST_PROXY: Joi.number().integer().min(0).default(0),
  ENABLE_BULL_BOARD: Joi.boolean().default(true),
  OVERDUE_ON_DEMAND_SECONDS: Joi.number().integer().min(0).default(0),
  CRON_SECRET: Joi.string().min(16),
  BULLMQ_DRAIN_DELAY_SECONDS: Joi.number().integer().min(1).default(5),
  OVERDUE_CHECK_INTERVAL_MS: Joi.number().integer().min(1000).default(60000),
  DASHBOARD_CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  // Basic-auth credentials protecting /api-docs. Dev defaults exist for convenience; production must set its own.
  SWAGGER_USER: Joi.string().min(1).default('apidocs'),
  SWAGGER_PASS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(8).required(),
    otherwise: Joi.string().min(8).default('ApiDocs@12345'),
  }),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Invalid environment configuration: ${error.details.map((d) => d.message).join('; ')}`);
}

export const env: Env = value;
