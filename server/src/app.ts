import express from 'express';
import { requestIdMiddleware } from './middleware/request-id.js';
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimitMiddleware,
} from './middleware/security.js';
import { errorHandler, NotFoundError } from './modules/core/errors/index.js';
import { logger } from './modules/core/logger/index.js';
import {
  authenticateSession,
  csrfMiddleware,
  authRouter,
} from './modules/core/auth/index.js';
import { searchRouter } from './modules/core/search/routes.js';
import { leaveRouter } from './modules/leave/routes.js';
import { payrollRouter } from './modules/payroll/routes.js';
import analyticsRouter from './modules/analytics/routes.js';

const app = express();

// Wire global middlewares
app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json());

// Session parsing and context population
app.use(authenticateSession);

// CSRF double submit cookie check
app.use(csrfMiddleware);

// Mount auth module routes
app.use('/api/auth', authRouter);

// Mount search module routes
app.use('/api', searchRouter);

// Mount leave module routes
app.use('/api/leave', leaveRouter);

// Mount payroll module routes
app.use('/api/payroll', payrollRouter);

// Mount analytics module routes
app.use('/api/analytics', analyticsRouter);


// Log incoming request metadata
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      requestId: req.headers['x-request-id'],
    });
  });
  next();
});

// Health check endpoint conforming to OpenAPI schema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Unhandled route catch-all (returns NotFoundError)
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

export { app };
