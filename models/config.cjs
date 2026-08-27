require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  username: process.env.DB_USER || 'hieronymus',
  password: process.env.DB_PASSWORD || 'hieronymus',
  database: process.env.DB_NAME || (env === 'test' ? 'hieronymus_test' : 'hieronymus_dev'),
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false
};

module.exports = {
  development: {
    ...baseConfig,
    database: process.env.DB_NAME || 'hieronymus_dev'
  },
  test: {
    ...baseConfig,
    database: process.env.DB_TEST_NAME || 'hieronymus_test',
    logging: false
  },
  production: {
    ...baseConfig,
    database: process.env.DB_NAME || 'hieronymus',
    logging: false
  }
};
