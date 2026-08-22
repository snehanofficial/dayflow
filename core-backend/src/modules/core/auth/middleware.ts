import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { parseCookies } from './csrf.js';

// Extend Express Request type to attach session context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        employeeId: string;
        role: string;
        emailVerified: boolean;
      };
      session?: {
        id: string;
        token: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests based on the database-backed secure session cookie.
 */
export async function authenticateSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies['sid'];

    if (!sessionToken) {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clear invalid session cookie
      res.clearCookie('sid');
      return next();
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      employeeId: session.user.employeeId,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    };
    req.session = {
      id: session.id,
      token: session.token,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require authentication.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  next();
}

/**
 * Middleware to enforce role-based access control.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (req.user.role !== role) {
      return next(new ForbiddenError('Access denied: Unauthorized role'));
    }
    next();
  };
}

/**
 * Middleware to enforce granular resource-action permissions on routes.
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const permission = await prisma.userPermission.findFirst({
      where: {
        userId: req.user.id,
        resource,
        action,
      },
    });

    if (!permission) {
      return next(
        new ForbiddenError(
          `Permission denied: Requires ${resource}.${action} permission.`,
        ),
      );
    }

    next();
  };
}
