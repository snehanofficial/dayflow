import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './request-id.js';

describe('requestIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should generate a new UUID if x-request-id is missing', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    const generatedId = mockRequest.headers?.['x-request-id'];
    expect(generatedId).toBeDefined();
    expect(typeof generatedId).toBe('string');
    // UUID regex check
    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      generatedId,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should retain a client-supplied compliant UUID request ID', () => {
    const clientUuid = '12345678-1234-1234-1234-123456789abc';
    mockRequest.headers = { 'x-request-id': clientUuid };

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.headers?.['x-request-id']).toBe(clientUuid);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      clientUuid,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should discard and regenerate request ID if client-supplied ID is non-compliant', () => {
    const maliciousId = 'malicious-string-or-script-tag-<script>';
    mockRequest.headers = { 'x-request-id': maliciousId };

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    const generatedId = mockRequest.headers?.['x-request-id'] as string;
    expect(generatedId).toBeDefined();
    expect(generatedId).not.toBe(maliciousId);
    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      generatedId,
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
