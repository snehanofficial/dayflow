import { describe, it, expect } from 'vitest';
import { config } from './config.js';

describe('Frontend Configuration', () => {
  it('should parse and load the VITE_API_URL environment configuration correctly', () => {
    expect(config).toBeDefined();
    expect(config.apiUrl).toBeDefined();
    expect(typeof config.apiUrl).toBe('string');
    // Verify it either matches default localhost or environment setting
    expect(config.apiUrl.startsWith('http')).toBe(true);
  });
});
