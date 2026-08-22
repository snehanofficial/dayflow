import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from './app.js';

describe('Express Integration Tests', () => {
  let server: Server;
  let testUrl: string;

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      // Listen on port 0 to bind to a random free port assigned by the OS
      server = app.listen(0, () => {
        const address = server.address();
        if (typeof address === 'object' && address !== null) {
          testUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should return 200 OK and valid health JSON on GET /api/health', async () => {
    const response = await fetch(`${testUrl}/api/health`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('should inject correlation request ID in response headers', async () => {
    const response = await fetch(`${testUrl}/api/health`);
    const requestId = response.headers.get('x-request-id');
    expect(requestId).toBeDefined();
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('should respond with security headers configured by Helmet', async () => {
    const response = await fetch(`${testUrl}/api/health`);

    // Check for helmet-injected headers
    const contentTypeOptions = response.headers.get('X-Content-Type-Options');
    expect(contentTypeOptions).toBe('nosniff');

    const dnsPrefetchControl = response.headers.get('X-DNS-Prefetch-Control');
    expect(dnsPrefetchControl).toBe('off');
  });

  it('should return 500/404 with standardized error format for unhandled routes', async () => {
    const response = await fetch(`${testUrl}/api/unmapped-route-xyz`);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Not Found');
  });
});
