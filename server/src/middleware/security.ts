import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from '../modules/core/config/index.js';
import { RateLimitError } from '../modules/core/errors/index.js';

// CORS Middleware configured from environment settings
export const corsMiddleware = cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-request-id',
    'x-csrf-token',
    'Cache-Control',
    'Pragma',
  ],
  credentials: true,
});

// Helmet Middleware for security headers
export const helmetMiddleware = helmet();

/**
 * Standard rate limiter using express-rate-limit.
 * In-memory store is appropriate for a single-instance starter.
 * When horizontally scaling, configure a RedisStore here.
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => config.NODE_ENV === 'test', // Skip in test mode
  handler: (req, res, next) => {
    next(
      new RateLimitError('Too many requests from this IP, please try again.'),
    );
  },
});
