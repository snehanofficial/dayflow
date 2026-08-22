import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../../app.js';
import { prisma } from '../database/index.js';
import { hashPassword } from './hash.js';
import { authRouter } from './routes.js';

// Register test routes for PUT/PATCH/DELETE testing on authRouter
authRouter.put('/test-csrf-put', (req, res) => {
  res.json({ success: true });
});
authRouter.patch('/test-csrf-patch', (req, res) => {
  res.json({ success: true });
});
authRouter.delete('/test-csrf-delete', (req, res) => {
  res.json({ success: true });
});

describe('Auth & CSRF Integration Tests', () => {
  let server: Server;
  let testUrl: string;

  beforeAll(async () => {
    const email = 'test-csrf-user@example.com';
    const password = 'password123';
    const passwordHash = await hashPassword(password);

    // Clean up existing test user
    await prisma.user.deleteMany({ where: { email } });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        employeeId: 'EMP-AUTH-TEST',
        role: 'HR',
        emailVerified: true,
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: 'test-session-token-12345',
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
      where: { email: 'test-csrf-user@example.com' },
    });
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should establish a CSRF token and set the csrf-token cookie via GET /api/auth/csrf', async () => {
    const response = await fetch(`${testUrl}/api/auth/csrf`);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.csrfToken).toBeDefined();
    expect(typeof body.csrfToken).toBe('string');

    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toContain('csrf-token=');
    expect(setCookie).toContain(body.csrfToken);
  });

  it('should reject GET /api/auth/me with 401 when no session is present', async () => {
    const response = await fetch(`${testUrl}/api/auth/me`);
    expect(response.status).toBe(401);
  });

  it('should return 200 and user info for GET /api/auth/me with a valid session cookie without needing CSRF', async () => {
    const response = await fetch(`${testUrl}/api/auth/me`, {
      headers: {
        Cookie: 'sid=test-session-token-12345',
      },
    });
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.user.email).toBe('test-csrf-user@example.com');
    expect(body.csrfToken).toBeDefined();

    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toContain('csrf-token=');
  });

  it('should reject state-changing POST requests if CSRF validation fails (no header/cookie)', async () => {
    const response = await fetch(`${testUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-csrf-user@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('CSRF token validation failed');
  });

  it('should reject state-changing PUT/PATCH/DELETE requests if CSRF token mismatch', async () => {
    const response = await fetch(`${testUrl}/api/auth/test-csrf-put`, {
      method: 'PUT',
      headers: {
        'x-csrf-token': 'wrong-token',
        Cookie: 'csrf-token=correct-token',
      },
    });
    expect(response.status).toBe(403);
  });

  it('should succeed for PUT, PATCH, DELETE requests with matching CSRF cookie and header', async () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const csrfToken = 'valid-token-123';
      const response = await fetch(
        `${testUrl}/api/auth/test-csrf-${method.toLowerCase()}`,
        {
          method,
          headers: {
            'x-csrf-token': csrfToken,
            Cookie: `csrf-token=${csrfToken}`,
          },
        },
      );
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.success).toBe(true);
    }
  });

  it('should permit OPTIONS requests without CSRF checks', async () => {
    const response = await fetch(`${testUrl}/api/auth/test-csrf-put`, {
      method: 'OPTIONS',
    });
    expect(response.status).toBeLessThan(400);
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully sign up a new user with employeeId/role, requiring email verification before login', async () => {
      const email = 'new-signup-test@example.com';
      const employeeId = 'EMP-NEW-SIGNUP';
      // clean up test user
      await prisma.user.deleteMany({ where: { email } });

      const csrfToken = 'valid-token-123';
      const response = await fetch(`${testUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          email,
          password: 'securePassword123',
          employeeId,
          role: 'Employee',
        }),
      });

      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('Account created');

      // Fetch user from DB to verify state
      const dbUser = await prisma.user.findUnique({ where: { email } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.emailVerified).toBe(false);
      expect(dbUser?.verificationToken).toBeDefined();

      // Attempt to login without verification -> should fail
      const loginResponse = await fetch(`${testUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          email,
          password: 'securePassword123',
        }),
      });
      expect(loginResponse.status).toBe(403);
      const loginBody: any = await loginResponse.json();
      expect(loginBody.error.code).toBe('AUTH_EMAIL_NOT_VERIFIED');

      // Verify email with token
      const verifyResponse = await fetch(`${testUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          token: dbUser?.verificationToken,
        }),
      });
      expect(verifyResponse.status).toBe(200);
      const verifyBody: any = await verifyResponse.json();
      expect(verifyBody.success).toBe(true);

      // Now verify login works
      const loginSuccessResponse = await fetch(`${testUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          email,
          password: 'securePassword123',
        }),
      });
      expect(loginSuccessResponse.status).toBe(200);
      const loginSuccessBody: any = await loginSuccessResponse.json();
      expect(loginSuccessBody.user.emailVerified).toBe(true);
      expect(loginSuccessBody.user.role).toBe('EMPLOYEE');

      // cleanup
      await prisma.user.deleteMany({ where: { email } });
    });

    it('should reject signup if the email is already registered', async () => {
      const csrfToken = 'valid-token-123';
      const response = await fetch(`${testUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          email: 'test-csrf-user@example.com', // pre-existing seeded user in beforeAll
          password: 'password123',
          employeeId: 'EMP-DUP-EMAIL',
          role: 'Employee',
        }),
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error.code).toBe('AUTH_EMAIL_EXISTS');
    });

    it('should reject signup if password is less than 8 characters', async () => {
      const csrfToken = 'valid-token-123';
      const response = await fetch(`${testUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          email: 'another-signup-test@example.com',
          password: 'short',
          employeeId: 'EMP-SHORT-PWD',
          role: 'Employee',
        }),
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error.message).toContain(
        'Password must be at least 8 characters',
      );
    });
  });
});
