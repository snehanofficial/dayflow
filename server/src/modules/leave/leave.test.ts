import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../app.js';
import { prisma } from '../core/database/index.js';
import { hashPassword } from '../core/auth/hash.js';

describe('Leave Module Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  let employeeUserId: string;
  let hrUserId: string;
  let employeeCookie: string;
  let hrCookie: string;
  const csrfToken = 'test-csrf-token-abc-123';

  beforeAll(async () => {
    // Setup test users
    const pwdHash = await hashPassword('password123');

    // Clean up first (targeted only)
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-LEAVE-01', 'EMP-LEAVE-HR'] } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { in: ['emp-leave-test@example.com', 'hr-leave-test@example.com'] } } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['emp-leave-test@example.com', 'hr-leave-test@example.com'] },
      },
    });

    const empUser = await prisma.user.create({
      data: {
        email: 'emp-leave-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-LEAVE-01',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });
    employeeUserId = empUser.id;

    const hrUser = await prisma.user.create({
      data: {
        email: 'hr-leave-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-LEAVE-HR',
        role: 'HR',
        emailVerified: true,
      },
    });
    hrUserId = hrUser.id;

    // Create session tokens
    const empSession = await prisma.session.create({
      data: {
        userId: empUser.id,
        token: 'emp-leave-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    employeeCookie = `sid=${empSession.token}`;

    const hrSession = await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: 'hr-leave-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    hrCookie = `sid=${hrSession.token}`;

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
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-LEAVE-01', 'EMP-LEAVE-HR'] } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { in: ['emp-leave-test@example.com', 'hr-leave-test@example.com'] } } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['emp-leave-test@example.com', 'hr-leave-test@example.com'] },
      },
    });
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Submit Leave Request (POST /api/leave/request)', () => {
    it('should reject requests if unauthenticated', async () => {
      const response = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          leaveType: 'PAID',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          reason: 'Vacation',
        }),
      });
      expect(response.status).toBe(401);
    });

    it('should successfully create leave request for HR with PENDING status', async () => {
      const response = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          leaveType: 'PAID',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          reason: 'Vacation',
        }),
      });
      expect(response.status).toBe(201);
      const request: any = await response.json();
      expect(request.id).toBeDefined();
      expect(request.employeeId).toBe('EMP-LEAVE-HR');
      expect(request.status).toBe('PENDING');
    });

    it('should reject request if start date is after end date', async () => {
      const start = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const end = new Date().toISOString(); // Today

      const response = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          leaveType: 'PAID',
          startDate: start,
          endDate: end,
          reason: 'Invalid dates',
        }),
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error.message).toContain('Start date cannot be after end date');
    });

    it('should successfully create leave request for Employee with PENDING status', async () => {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 86400000 * 2).toISOString(); // 3 days total

      const response = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          leaveType: 'PAID',
          startDate: start,
          endDate: end,
          reason: 'Holiday trip',
        }),
      });

      expect(response.status).toBe(201);
      const request: any = await response.json();
      expect(request.id).toBeDefined();
      expect(request.employeeId).toBe('EMP-LEAVE-01');
      expect(request.leaveType).toBe('PAID');
      expect(request.status).toBe('PENDING');
      expect(request.remarks).toBeNull();
      expect(request.approvedBy).toBeNull();
    });
  });

  describe('Get My Leave Requests (GET /api/leave/my-requests)', () => {
    it('should return own requests list for Employee', async () => {
      const response = await fetch(`${testUrl}/api/leave/my-requests`, {
        headers: { Cookie: employeeCookie },
      });
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.requests).toBeDefined();
      expect(body.requests.length).toBeGreaterThan(0);
      expect(body.requests[0].employeeId).toBe('EMP-LEAVE-01');
    });

    it('should return own requests list for HR', async () => {
      const response = await fetch(`${testUrl}/api/leave/my-requests`, {
        headers: { Cookie: hrCookie },
      });
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.requests).toBeDefined();
      expect(body.requests.length).toBeGreaterThan(0);
      expect(body.requests[0].employeeId).toBe('EMP-LEAVE-HR');
    });
  });

  describe('Get Leave Balance (GET /api/leave/balance)', () => {
    it('should return initial full leave balance when no requests are approved', async () => {
      const response = await fetch(`${testUrl}/api/leave/balance`, {
        headers: { Cookie: employeeCookie },
      });
      expect(response.status).toBe(200);
      const balance: any = await response.json();
      expect(balance.paid.allocated).toBe(15);
      expect(balance.paid.used).toBe(0);
      expect(balance.paid.remaining).toBe(15);
      expect(balance.sick.allocated).toBe(10);
      expect(balance.sick.used).toBe(0);
      expect(balance.sick.remaining).toBe(10);
    });
  });

  describe('HR Leave Request Operations (GET /api/leave/all & PATCH)', () => {
    let targetRequestId: string;

    beforeAll(async () => {
      // Create a pending request to test HR approval workflow
      const req = await prisma.leaveRequest.create({
        data: {
          employeeId: 'EMP-LEAVE-01',
          leaveType: 'SICK',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 2), // 3 days
          reason: 'Fever',
          status: 'PENDING',
        },
      });
      targetRequestId = req.id;
    });

    it('should reject GET /all if logged in as Employee', async () => {
      const response = await fetch(`${testUrl}/api/leave/all`, {
        headers: { Cookie: employeeCookie },
      });
      expect(response.status).toBe(403);
    });

    it('should return all requests including user emails for HR', async () => {
      const response = await fetch(`${testUrl}/api/leave/all`, {
        headers: { Cookie: hrCookie },
      });
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.requests).toBeDefined();
      expect(body.requests.length).toBeGreaterThan(0);
      expect(body.requests.find((r: any) => r.id === targetRequestId).user.email).toBe('emp-leave-test@example.com');
    });

    it('should successfully approve a pending leave request', async () => {
      const response = await fetch(`${testUrl}/api/leave/${targetRequestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({ remarks: 'Get well soon' }),
      });

      expect(response.status).toBe(200);
      const updated: any = await response.json();
      expect(updated.status).toBe('APPROVED');
      expect(updated.remarks).toBe('Get well soon');
      expect(updated.approvedBy).toBe('EMP-LEAVE-HR');
    });

    it('should reflect approved leave request in Employee balance', async () => {
      const response = await fetch(`${testUrl}/api/leave/balance`, {
        headers: { Cookie: employeeCookie },
      });
      expect(response.status).toBe(200);
      const balance: any = await response.json();
      expect(balance.sick.allocated).toBe(10);
      expect(balance.sick.used).toBe(3); // 3 days used
      expect(balance.sick.remaining).toBe(7); // 7 remaining
    });

    it('should fail to approve/reject an already processed leave request', async () => {
      const response = await fetch(`${testUrl}/api/leave/${targetRequestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
        },
      });
      expect(response.status).toBe(400);
    });
  });
});
