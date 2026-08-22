import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { corsMiddleware, rateLimitMiddleware } from './security.js';

describe('Security Middlewares', () => {
  describe('CORS middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        headers: {},
      };
      mockResponse = {
        setHeader: vi.fn(),
        getHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it('should reflect the CORS origin when matching allowed origin', () => {
      mockRequest.headers = { origin: 'http://localhost:5173' };

      corsMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Verify that CORS middleware allowed the origin
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:5173',
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not allow CORS when request origin does not match configured origin', () => {
      mockRequest.headers = { origin: 'http://unapproved.com' };

      corsMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Verify that the unapproved origin is not reflected in access control headers
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://unapproved.com',
      );
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should export the configured rate limiter middleware function', () => {
      expect(typeof rateLimitMiddleware).toBe('function');
    });
  });
});
