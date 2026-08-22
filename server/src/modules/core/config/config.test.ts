import { describe, it, expect } from 'vitest';
import { validateConfig } from './index.js';
import { ZodError } from 'zod';

describe('validateConfig', () => {
  const baseEnv = {
    PORT: '4000',
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db',
    CORS_ORIGIN: 'http://localhost:5173',
  };

  it('should successfully parse a valid environment configuration', () => {
    const config = validateConfig(baseEnv);
    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.DATABASE_URL).toBe(
      'postgresql://postgres:postgres@localhost:5432/db',
    );
    expect(config.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('should fallback to defaults for PORT and NODE_ENV if missing', () => {
    const minimalEnv = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db',
      CORS_ORIGIN: 'http://localhost:5173',
    };
    const config = validateConfig(minimalEnv);
    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe('development');
  });

  it('should throw an error if DATABASE_URL is missing', () => {
    const invalidEnv = { ...baseEnv, DATABASE_URL: undefined };
    expect(() => validateConfig(invalidEnv as any)).toThrow(ZodError);
  });

  it('should throw an error if CORS_ORIGIN is missing', () => {
    const invalidEnv = { ...baseEnv, CORS_ORIGIN: '' };
    expect(() => validateConfig(invalidEnv)).toThrow(ZodError);
  });

  it('should throw an error if PORT is not a valid number', () => {
    const invalidEnv = { ...baseEnv, PORT: 'not-a-number' };
    expect(() => validateConfig(invalidEnv)).toThrow();
  });

  it('should throw an error if NODE_ENV is not one of the allowed values', () => {
    const invalidEnv = { ...baseEnv, NODE_ENV: 'production-invalid' };
    expect(() => validateConfig(invalidEnv)).toThrow();
  });
});
