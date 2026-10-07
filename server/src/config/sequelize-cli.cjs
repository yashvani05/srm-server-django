// Config for sequelize-cli (migrations/seeders). Reads the same env vars as the app.
// Local:   DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
// Hosted:  DATABASE_URL (+ DB_SSL=true), e.g. a Neon connection string.
require('dotenv').config();

const dialectOptions = process.env.DB_SSL === 'true' ? { ssl: { require: true } } : {};

const base = process.env.DATABASE_URL
  ? { use_env_variable: 'DATABASE_URL', dialect: 'postgres', dialectOptions }
  : {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD || null,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      dialect: 'postgres',
      dialectOptions,
    };

module.exports = { development: base, test: base, production: base };
