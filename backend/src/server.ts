import 'dotenv/config';
import { createServer } from 'node:http';
import pino from 'pino';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { PrismaDatabase } from './database/database.js';

const config = loadConfig();
const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]',
  },
});
const database = new PrismaDatabase();
const app = createApp({ config, database, logger });
const server = createServer(app);

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown started');

  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  forceShutdownTimer.unref();

  server.close(async (serverError) => {
    try {
      await database.disconnect();
      clearTimeout(forceShutdownTimer);
      if (serverError) {
        logger.error({ err: serverError }, 'HTTP server shutdown failed');
        process.exit(1);
      }
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Database disconnect failed');
      process.exit(1);
    }
  });
}

server.on('error', (error) => {
  logger.fatal({ err: error }, 'HTTP server failed');
  process.exit(1);
});

server.listen(config.port, () => {
  logger.info({ port: config.port, environment: config.nodeEnv }, 'HTTP server listening');
});

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
