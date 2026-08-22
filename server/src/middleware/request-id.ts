import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headerName = 'x-request-id';
  const existingId = req.headers[headerName];
  let requestId: string;

  if (typeof existingId === 'string' && UUID_REGEX.test(existingId)) {
    requestId = existingId;
  } else if (
    Array.isArray(existingId) &&
    existingId[0] &&
    UUID_REGEX.test(existingId[0])
  ) {
    requestId = existingId[0];
  } else {
    requestId = crypto.randomUUID();
  }

  // Enforce consistent header type on request and set on response
  req.headers[headerName] = requestId;
  res.setHeader(headerName, requestId);

  next();
};
