import dotenv from 'dotenv';

dotenv.config();

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (val) => {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
	  // named pipe
	  return val;
	}

	if (port >= 0) {
	  // port number
	  return port;
	}

	return false;
  }

/**
 * Fail-loud: in production, EXPRESS secret MUST be provided via env.
 * The default 'hieronymus' is only safe for development.
 */
const nodeEnv = process.env.NODE_ENV || 'development';
const expressSecret = process.env.EXPRESS;
if (nodeEnv === 'production' && !expressSecret) {
  console.error('[FATAL] EXPRESS environment variable must be set in production. Refusing to start with a default secret.');
  process.exit(1);
}

export default {
	port: normalizePort(process.env.PORT || '3010'),
	home: process.env.HOME,
	session_ttl: 3600 * 24 * 7,
	session_path: process.env.SESSION_PATH || './sessions',
	backup_dir:  process.env.BACKUP_DIR || './backups',
	expressSecret: expressSecret || 'hieronymus',
	appName: process.env.APP_NAME || 'hieronymus2',
	corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [],
};
