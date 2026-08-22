import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/index.js';
import { config } from '../config/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class AuthInvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super(message, 401, 'AUTH_INVALID_CREDENTIALS');
  }
}

export class AuthEmailExistsError extends AppError {
  constructor(message = 'Email address is already registered') {
    super(message, 400, 'AUTH_EMAIL_EXISTS');
  }
}

export class AuthEmailNotVerifiedError extends AppError {
  constructor(message = 'Please verify your email before signing in.') {
    super(message, 403, 'AUTH_EMAIL_NOT_VERIFIED');
  }
}

export class AuthInvalidVerificationError extends AppError {
  constructor(message = 'This verification link is invalid or expired.') {
    super(message, 400, 'AUTH_INVALID_VERIFICATION');
  }
}

export class AuthSessionExpiredError extends AppError {
  constructor(message = 'Session has expired') {
    super(message, 401, 'AUTH_SESSION_EXPIRED');
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const isProd = config.NODE_ENV === 'production';
  const requestId = req.headers['x-request-id'] || 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode === 401) {
      logger.info({
        msg: 'Operational Error (Expected)',
        err: err.message,
        code: err.code,
        statusCode: err.statusCode,
        requestId,
      });
    } else {
      logger.warn({
        msg: 'Operational Error',
        err: err.message,
        code: err.code,
        statusCode: err.statusCode,
        requestId,
      });
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unhandled system exceptions
  logger.error({
    msg: 'Unhandled Exception',
    err: err.stack || err.message,
    requestId,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd ? 'An unexpected error occurred' : err.message,
    },
  });
};
