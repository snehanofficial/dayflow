import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ForbiddenError } from '../errors/index.js';
import { logger } from '../logger/index.js';
import { config } from '../config/index.js';

/**
 * Generate a cryptographically secure random token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Parse cookies manually from the Request header since we do not use cookie-parser.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((item) => {
    const parts = item.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      cookies[name] = decodeURIComponent(parts.join('='));
    }
  });

  return cookies;
}

/**
 * CSRF Double Submit Cookie validation middleware.
 * Validates that the 'x-csrf-token' header matches the 'csrf-token' cookie.
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Allow safe HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    if (config.NODE_ENV === 'development') {
      logger.warn({
        msg: 'CSRF token validation failed diagnostics',
        method: req.method,
        route: req.originalUrl,
        cookieExists: !!cookieToken,
        headerExists: !!headerToken,
      });
    }
    return next(new ForbiddenError('CSRF token validation failed'));
  }

  next();
}
