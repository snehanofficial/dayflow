import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  errorHandler,
} from './index.js';
import { config } from '../config/index.js';

describe('Error Handling System', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('AppError classes', () => {
    it('should correctly set parameters in AppError constructor', () => {
      const error = new AppError('Custom Error Message', 418, 'TEAPOT', {
        foo: 'bar',
      });
      expect(error.message).toBe('Custom Error Message');
      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('TEAPOT');
      expect(error.details).toEqual({ foo: 'bar' });
    });

    it('should configure BadRequestError with status code 400', () => {
      const error = new BadRequestError('Invalid input data');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input data');
    });

    it('should configure NotFoundError with status code 404', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError by returning JSON and correct status', () => {
      const error = new BadRequestError('Validation failed', [
        { field: 'email', error: 'required' },
      ]);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details: [{ field: 'email', error: 'required' }],
        },
      });
    });

    it('should format a safe 500 error payload in production mode', () => {
      // Mock NODE_ENV to production
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = 'production';

      const error = new Error('Database secret connection string leaked!');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Restore NODE_ENV
      config.NODE_ENV = originalEnv;

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });

    it('should output detailed 500 error messages in development/test mode', () => {
      const originalEnv = config.NODE_ENV;
      config.NODE_ENV = 'development';

      const error = new Error('Internal system failure detail');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      config.NODE_ENV = originalEnv;

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal system failure detail',
        },
      });
    });
  });
});
