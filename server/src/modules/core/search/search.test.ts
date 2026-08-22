import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../../app.js';
import { prisma } from '../database/index.js';
import { hashPassword } from '../auth/hash.js';

describe('Search Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  let userId: string;

  beforeAll(async () => {
    const email = 'test-search-user@example.com';
    const password = 'password123';
    const passwordHash = await hashPassword(password);

    // Clean up if user already exists
    await prisma.user.deleteMany({ where: { email } });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        employeeId: 'EMP-SEARCH-TEST',
        role: 'HR',
        emailVerified: true,
      },
    });
    userId = user.id;

    await prisma.session.create({
      data: {
        userId: user.id,
        token: 'test-search-session-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return new Promise<void>((resolve) => {
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
    await prisma.user.deleteMany({
      where: { email: 'test-search-user@example.com' },
    });
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should reject search requests if session cookie is missing', async () => {
    const response = await fetch(`${testUrl}/api/users/search?q=test`);
    expect(response.status).toBe(401);
  });

  it('should return matched users list when session cookie is valid', async () => {
    const response = await fetch(`${testUrl}/api/users/search?q=search-user`, {
      headers: {
        Cookie: 'sid=test-search-session-token-123',
      },
    });
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.users).toBeDefined();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
    expect(body.users[0].email).toBe('test-search-user@example.com');
  });

  it('should return empty list when no users match the query string', async () => {
    const response = await fetch(
      `${testUrl}/api/users/search?q=nonexistentqueryxyz`,
      {
        headers: {
          Cookie: 'sid=test-search-session-token-123',
        },
      },
    );
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.users).toEqual([]);
  });
});
