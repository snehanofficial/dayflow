import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient, ApiError, clearCsrfToken } from './client.js';

// ─── MSW server ──────────────────────────────────────────────────────────────

const BASE = 'http://localhost:4000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  clearCsrfToken();
  // Clear test csrf-token cookie
  document.cookie =
    'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
});
afterAll(() => server.close());

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('apiClient', () => {
  it('resolves with parsed JSON on a successful 200 response', async () => {
    const mockData = { id: '123', email: 'test@example.com' };
    server.use(
      http.get(`${BASE}/api/users/123`, () => HttpResponse.json(mockData)),
    );

    const result = await apiClient<typeof mockData>('/api/users/123');
    expect(result).toEqual(mockData);
  });

  it('returns empty object on 204 No Content', async () => {
    server.use(
      http.post(
        `${BASE}/api/logout`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const result = await apiClient('/api/logout', { method: 'POST' });
    expect(result).toEqual({});
  });

  it('throws ApiError with correct properties on a 400 response', async () => {
    const errorPayload = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [{ field: 'email', issue: 'invalid' }],
      },
    };
    server.use(
      http.get(`${BASE}/api/users`, () =>
        HttpResponse.json(errorPayload, { status: 400 }),
      ),
    );

    await expect(apiClient('/api/users')).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof ApiError)) return false;
      expect(err.status).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Validation failed');
      expect(err.details).toEqual([{ field: 'email', issue: 'invalid' }]);
      return true;
    });
  });

  it('falls back to statusText on non-ok responses without JSON error body', async () => {
    server.use(
      http.get(
        `${BASE}/api/health`,
        () =>
          new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          }),
      ),
    );

    await expect(apiClient('/api/health')).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof ApiError)) return false;
      expect(err.status).toBe(500);
      return true;
    });
  });

  it('does not attach x-csrf-token on GET requests even when token is set', async () => {
    // Seed the in-memory token
    server.use(
      http.get(`${BASE}/api/auth/csrf`, () =>
        HttpResponse.json({ csrfToken: 'seeded-token' }),
      ),
    );
    await apiClient('/api/auth/csrf');

    let capturedHeaders: Headers | null = null;
    server.use(
      http.get(`${BASE}/api/safe-route`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({});
      }),
    );
    await apiClient('/api/safe-route');

    expect(capturedHeaders!.get('x-csrf-token')).toBeNull();
  });

  it('automatically attaches x-csrf-token for POST when in-memory token is set', async () => {
    // Seed the in-memory token
    server.use(
      http.get(`${BASE}/api/auth/csrf`, () =>
        HttpResponse.json({ csrfToken: 'test-csrf-token-12345' }),
      ),
    );
    await apiClient('/api/auth/csrf');

    let capturedHeaders: Headers | null = null;
    server.use(
      http.post(`${BASE}/api/unsafe-route`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({});
      }),
    );
    await apiClient('/api/unsafe-route', { method: 'POST' });

    expect(capturedHeaders!.get('x-csrf-token')).toBe('test-csrf-token-12345');
  });

  it('does not attach x-csrf-token for POST if in-memory token has been cleared', async () => {
    // Seed then clear
    server.use(
      http.get(`${BASE}/api/auth/csrf`, () =>
        HttpResponse.json({ csrfToken: 'some-token' }),
      ),
    );
    await apiClient('/api/auth/csrf');
    clearCsrfToken();

    let capturedHeaders: Headers | null = null;
    server.use(
      http.post(`${BASE}/api/unsafe-route`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({});
      }),
    );
    await apiClient('/api/unsafe-route', { method: 'POST' });

    expect(capturedHeaders!.get('x-csrf-token')).toBeNull();
  });

  it('writes csrfToken from response into in-memory store and document.cookie', async () => {
    server.use(
      http.get(`${BASE}/api/auth/csrf`, () =>
        HttpResponse.json({ csrfToken: 'newly-retrieved-token-999' }),
      ),
    );

    const result = await apiClient<{ csrfToken: string }>('/api/auth/csrf');
    expect(result.csrfToken).toBe('newly-retrieved-token-999');

    const match = document.cookie.match(/csrf-token=([^;]+)/);
    expect(match).not.toBeNull();
    expect(decodeURIComponent(match![1])).toBe('newly-retrieved-token-999');
  });

  it('forwards body string as JSON data for backward compat', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post(`${BASE}/api/resource`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({});
      }),
    );

    // Seed a CSRF token so the POST doesn't get rejected client-side
    server.use(
      http.get(`${BASE}/api/auth/csrf`, () =>
        HttpResponse.json({ csrfToken: 'tok' }),
      ),
    );
    await apiClient('/api/auth/csrf');

    await apiClient('/api/resource', {
      method: 'POST',
      body: JSON.stringify({ data: 'bar' }),
    });

    expect(capturedBody).toEqual({ data: 'bar' });
  });
});
