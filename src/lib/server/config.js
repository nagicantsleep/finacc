import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  if (!process.env.EXPRESS || process.env.EXPRESS === 'hieronymus_secret_dev_key') {
    throw new Error('FATAL: EXPRESS secret environment variable must be set to a secure non-default value in production mode.');
  }
}

export const config = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || '3010', 10),
  appName: process.env.APP_NAME || 'hieronymus',
  expressSecret: process.env.EXPRESS || 'hieronymus_secret_dev_key',
  sessionTtl: 3600 * 24 * 7,
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || (nodeEnv === 'test' ? 'sample_test' : 'sample_development'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : (nodeEnv === 'production' ? 20 : 5),
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
      application_name: process.env.DB_APPLICATION_NAME || `kaikei-${nodeEnv}`,
      ...(process.env.DB_SSL ? { ssl: { rejectUnauthorized: process.env.DB_SSL !== 'false' } } : {})
    }
  }
};

export default config;
