import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../app.js';
import { prisma } from '../core/database/index.js';
import { hashPassword } from '../core/auth/hash.js';

/**
 * Phase 7 — Integration & Security Hardening Tests
 *
 * These tests verify that:
 * 1. Employee role isolation is enforced across all Dev B modules
 * 2. Cross-employee data leakage is impossible through API boundaries
 * 3. HR-only endpoints properly reject non-HR users
 * 4. Notifications are user-scoped (no cross-user leakage)
 * 5. Salary slip access is restricted to own data for employees
 */
describe('Security Hardening Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  const csrfToken = 'sec-hardening-csrf-token';

  // Two employee users + one HR user
  let empACookie: string;
  let empBCookie: string;
  let hrCookie: string;

  const EMP_A_EMAIL = 'sec-emp-a@example.com';
  const EMP_B_EMAIL = 'sec-emp-b@example.com';
  const HR_EMAIL = 'sec-hr@example.com';
  const EMP_A_ID = 'SEC-EMP-A';
  const EMP_B_ID = 'SEC-EMP-B';
  const HR_EMP_ID = 'SEC-HR-01';

  beforeAll(async () => {
    const pwdHash = await hashPassword('password123');

    // Targeted cleanup
    await prisma.notification.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.userPermission.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
    });

    // Create test users
    const empA = await prisma.user.create({
      data: {
        email: EMP_A_EMAIL,
        passwordHash: pwdHash,
        employeeId: EMP_A_ID,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });

    const empB = await prisma.user.create({
      data: {
        email: EMP_B_EMAIL,
        passwordHash: pwdHash,
        employeeId: EMP_B_ID,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });

    const hrUser = await prisma.user.create({
      data: {
        email: HR_EMAIL,
        passwordHash: pwdHash,
        employeeId: HR_EMP_ID,
        role: 'HR',
        emailVerified: true,
      },
    });

    // Grant analytics permission only to HR
    await prisma.userPermission.create({
      data: { userId: hrUser.id, resource: 'analytics', action: 'read' },
    });

    // Create sessions
    const sessA = await prisma.session.create({
      data: {
        userId: empA.id,
        token: 'sec-emp-a-session',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    empACookie = `sid=${sessA.token}`;

    const sessB = await prisma.session.create({
      data: {
        userId: empB.id,
        token: 'sec-emp-b-session',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    empBCookie = `sid=${sessB.token}`;

    const sessHR = await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: 'sec-hr-session',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    hrCookie = `sid=${sessHR.token}`;

    // Seed test data:
    // Employee A leave request
    await prisma.leaveRequest.create({
      data: {
        employeeId: EMP_A_ID,
        leaveType: 'PAID',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        reason: 'Employee A vacation',
        status: 'PENDING',
      },
    });

    // Employee B leave request
    await prisma.leaveRequest.create({
      data: {
        employeeId: EMP_B_ID,
        leaveType: 'SICK',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        reason: 'Employee B sick day',
        status: 'PENDING',
      },
    });

    // Salary structure for Employee A
    await prisma.salaryStructure.create({
      data: {
        employeeId: EMP_A_ID,
        basicSalary: 50000,
        allowances: 10000,
        deductions: 5000,
        department: 'Engineering',
        designation: 'Developer',
      },
    });

    // Generate slip for Employee A
    await prisma.salarySlip.create({
      data: {
        employeeId: EMP_A_ID,
        month: '2026-07',
        basicSalary: 50000,
        allowances: 10000,
        deductions: 5000,
        netSalary: 55000,
        department: 'Engineering',
        designation: 'Developer',
        status: 'PAID',
      },
    });

    // Notifications for both users
    await prisma.notification.create({
      data: {
        userId: empA.id,
        title: 'Private for A',
        message: 'Only Employee A should see this',
        type: 'LEAVE_STATUS',
        read: false,
      },
    });
    await prisma.notification.create({
      data: {
        userId: empB.id,
        title: 'Private for B',
        message: 'Only Employee B should see this',
        type: 'LEAVE_STATUS',
        read: false,
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
    await prisma.notification.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: [EMP_A_ID, EMP_B_ID, HR_EMP_ID] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.userPermission.deleteMany({
      where: {
        user: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [EMP_A_EMAIL, EMP_B_EMAIL, HR_EMAIL] } },
    });
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ----------------------------------------------------------------
  // 1. LEAVE MODULE — Employee Data Isolation
  // ----------------------------------------------------------------
  describe('Leave: Employee data isolation', () => {
    it('Employee A /my-requests should only return Employee A records', async () => {
      const res = await fetch(`${testUrl}/api/leave/my-requests`, {
        headers: { Cookie: empACookie },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.requests.length).toBeGreaterThan(0);
      for (const req of body.requests) {
        expect(req.employeeId).toBe(EMP_A_ID);
      }
    });

    it('Employee B /my-requests should only return Employee B records', async () => {
      const res = await fetch(`${testUrl}/api/leave/my-requests`, {
        headers: { Cookie: empBCookie },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.requests.length).toBeGreaterThan(0);
      for (const req of body.requests) {
        expect(req.employeeId).toBe(EMP_B_ID);
      }
    });

    it('Employee should NOT access /api/leave/all', async () => {
      const res = await fetch(`${testUrl}/api/leave/all`, {
        headers: { Cookie: empACookie },
      });
      expect(res.status).toBe(403);
    });

    it('Employee should NOT approve leave requests', async () => {
      // Find Employee B's pending request
      const allRes = await fetch(`${testUrl}/api/leave/all`, {
        headers: { Cookie: hrCookie },
      });
      const allBody: any = await allRes.json();
      const pendingReq = allBody.requests.find(
        (r: any) => r.employeeId === EMP_B_ID && r.status === 'PENDING',
      );

      if (pendingReq) {
        const res = await fetch(
          `${testUrl}/api/leave/${pendingReq.id}/approve`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
              Cookie: `${empACookie}; csrf-token=${csrfToken}`,
            },
            body: JSON.stringify({ remarks: 'Unauthorized attempt' }),
          },
        );
        expect(res.status).toBe(403);
      }
    });

    it('Employee should NOT reject leave requests', async () => {
      const allRes = await fetch(`${testUrl}/api/leave/all`, {
        headers: { Cookie: hrCookie },
      });
      const allBody: any = await allRes.json();
      const pendingReq = allBody.requests.find(
        (r: any) => r.employeeId === EMP_B_ID && r.status === 'PENDING',
      );

      if (pendingReq) {
        const res = await fetch(
          `${testUrl}/api/leave/${pendingReq.id}/reject`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
              Cookie: `${empACookie}; csrf-token=${csrfToken}`,
            },
            body: JSON.stringify({ remarks: 'Unauthorized attempt' }),
          },
        );
        expect(res.status).toBe(403);
      }
    });
  });

  // ----------------------------------------------------------------
  // 2. PAYROLL MODULE — Role & Ownership Enforcement
  // ----------------------------------------------------------------
  describe('Payroll: Role & ownership enforcement', () => {
    it('Employee should NOT be able to generate salary slips', async () => {
      const res = await fetch(`${testUrl}/api/payroll/slip/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${empACookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: EMP_A_ID,
          month: '2026-08',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('Employee should NOT configure salary structures', async () => {
      const res = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${empACookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: EMP_A_ID,
          basicSalary: 100000,
          allowances: 20000,
          deductions: 10000,
          department: 'Engineering',
          designation: 'Senior Developer',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('Employee A should NOT view Employee B salary structure via query param', async () => {
      const res = await fetch(
        `${testUrl}/api/payroll/salary-structure?employeeId=${EMP_B_ID}`,
        {
          headers: { Cookie: empACookie },
        },
      );
      // Should be 403 or 404 (B has no structure, A is not HR)
      expect([403, 404]).toContain(res.status);
    });

    it('Employee B should NOT view Employee A salary slip by ID', async () => {
      // First get Employee A's slip ID via HR
      const slipsRes = await fetch(
        `${testUrl}/api/payroll/slips?employeeId=${EMP_A_ID}`,
        {
          headers: { Cookie: hrCookie },
        },
      );
      const slipsBody: any = await slipsRes.json();
      const slipA = slipsBody.slips.find((s: any) => s.employeeId === EMP_A_ID);

      if (slipA) {
        const res = await fetch(`${testUrl}/api/payroll/slip/${slipA.id}`, {
          headers: { Cookie: empBCookie },
        });
        expect(res.status).toBe(403);
      }
    });

    it('Employee A should view own salary slip by ID', async () => {
      const slipsRes = await fetch(`${testUrl}/api/payroll/slips`, {
        headers: { Cookie: empACookie },
      });
      const slipsBody: any = await slipsRes.json();
      const ownSlip = slipsBody.slips.find(
        (s: any) => s.employeeId === EMP_A_ID,
      );

      if (ownSlip) {
        const res = await fetch(`${testUrl}/api/payroll/slip/${ownSlip.id}`, {
          headers: { Cookie: empACookie },
        });
        expect(res.status).toBe(200);
        const body: any = await res.json();
        expect(body.employeeId).toBe(EMP_A_ID);
      }
    });

    it('Employee /slips should only return own slips', async () => {
      const res = await fetch(`${testUrl}/api/payroll/slips`, {
        headers: { Cookie: empACookie },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      for (const slip of body.slips) {
        expect(slip.employeeId).toBe(EMP_A_ID);
      }
    });
  });

  // ----------------------------------------------------------------
  // 3. ANALYTICS MODULE — Permission Enforcement
  // ----------------------------------------------------------------
  describe('Analytics: Permission enforcement', () => {
    it('Employee without analytics permission should be rejected', async () => {
      const res = await fetch(`${testUrl}/api/analytics/dashboard`, {
        headers: { Cookie: empACookie },
      });
      expect(res.status).toBe(403);
    });

    it('HR with analytics permission should succeed', async () => {
      const res = await fetch(`${testUrl}/api/analytics/dashboard`, {
        headers: { Cookie: hrCookie },
      });
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------------
  // 4. NOTIFICATIONS MODULE — User Scope Isolation
  // ----------------------------------------------------------------
  describe('Notifications: User scope isolation', () => {
    it('Employee A should only see own notifications', async () => {
      const res = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: empACookie },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();

      // All notifications should belong to Employee A
      for (const n of body.notifications) {
        expect(n.title).not.toBe('Private for B');
      }
      // Should contain Employee A's notification
      const hasOwnNotification = body.notifications.some(
        (n: any) => n.title === 'Private for A',
      );
      expect(hasOwnNotification).toBe(true);
    });

    it('Employee B should only see own notifications', async () => {
      const res = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: empBCookie },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();

      for (const n of body.notifications) {
        expect(n.title).not.toBe('Private for A');
      }
      const hasOwnNotification = body.notifications.some(
        (n: any) => n.title === 'Private for B',
      );
      expect(hasOwnNotification).toBe(true);
    });

    it('Employee A mark-read should NOT affect Employee B notifications', async () => {
      // Mark all of A's notifications as read
      await fetch(`${testUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${empACookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({}),
      });

      // Verify B still has unread notifications
      const res = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: empBCookie },
      });
      const body: any = await res.json();
      const unread = body.notifications.filter((n: any) => !n.read);
      expect(unread.length).toBeGreaterThan(0);
    });

    it('Unauthenticated requests to notifications should be rejected', async () => {
      const res = await fetch(`${testUrl}/api/notifications`);
      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------------
  // 5. CSRF — State-changing requests require CSRF token
  // ----------------------------------------------------------------
  describe('CSRF: State-changing requests enforcement', () => {
    it('POST /api/leave/request without CSRF should be rejected', async () => {
      const res = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: empACookie,
        },
        body: JSON.stringify({
          leaveType: 'PAID',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          reason: 'No CSRF test',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('POST /api/notifications/mark-read without CSRF should be rejected', async () => {
      const res = await fetch(`${testUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: empACookie,
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(403);
    });
  });
});
