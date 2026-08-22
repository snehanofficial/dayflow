import { Server } from 'http';
import { app } from './app.js';
import { config } from './modules/core/config/index.js';
import { logger } from './modules/core/logger/index.js';

const server: Server = app.listen(config.PORT, () => {
  logger.info(
    `[server]: HackCore API running in ${config.NODE_ENV} mode on http://localhost:${config.PORT}`,
  );
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed successfully. Exiting.');
    process.exit(0);
  });

  // Enforce a hard timeout limit for connection drains
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
