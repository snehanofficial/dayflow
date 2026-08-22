import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../app.js';
import { prisma } from '../core/database/index.js';
import { hashPassword } from '../core/auth/hash.js';

let server: Server;
let testUrl: string;
let employeeUserId: string;
let hrUserId: string;
let employeeCookie: string;
let hrCookie: string;
const csrfToken = 'notifications-csrf-token';

describe('Notifications Module Integration Tests', () => {
  beforeAll(async () => {
    const pwdHash = await hashPassword('password123');

    await prisma.notification.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
          },
        },
      },
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
        },
      },
    });

    // Create test users
    const empUser = await prisma.user.create({
      data: {
        email: 'emp-notify-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-NOTIFY-01',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });
    employeeUserId = empUser.id;

    const hrUser = await prisma.user.create({
      data: {
        email: 'hr-notify-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-NOTIFY-HR',
        role: 'HR',
        emailVerified: true,
      },
    });
    hrUserId = hrUser.id;

    // Create session tokens
    const empSession = await prisma.session.create({
      data: {
        userId: empUser.id,
        token: 'emp-notify-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    employeeCookie = `sid=${empSession.token}`;

    const hrSession = await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: 'hr-notify-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    hrCookie = `sid=${hrSession.token}`;

    // Seed payroll and leave manage permissions for HR
    await prisma.userPermission.createMany({
      data: [
        { userId: hrUser.id, resource: 'leave', action: 'manage' },
        { userId: hrUser.id, resource: 'payroll', action: 'manage' },
      ],
    });

    // Seed salary structure for employee
    await prisma.salaryStructure.create({
      data: {
        employeeId: 'EMP-NOTIFY-01',
        basicSalary: 5000,
        allowances: 1000,
        deductions: 500,
        department: 'Engineering',
        designation: 'Engineer',
      },
    });

    // Start server
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
        user: {
          email: {
            in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
          },
        },
      },
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-NOTIFY-01', 'EMP-NOTIFY-HR'] } },
    });
    await prisma.userPermission.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
          },
        },
      },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['emp-notify-test@example.com', 'hr-notify-test@example.com'],
        },
      },
    });
    return new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe('Secure endpoints access check', () => {
    it('should deny unauthenticated requests from loading feed', async () => {
      const response = await fetch(`${testUrl}/api/notifications`);
      expect(response.status).toBe(401);
    });
  });

  describe('Notification Trigger Flow & Lifecycle', () => {
    let leaveRequestId: string;
    let employeeNotificationId: string;

    it('should trigger HR notification when Employee submits a leave request', async () => {
      // 1. Submit leave request as employee
      const leaveRes = await fetch(`${testUrl}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          leaveType: 'SICK',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Fever',
        }),
      });

      expect(leaveRes.status).toBe(201);
      const leaveData = (await leaveRes.json()) as any;
      leaveRequestId = leaveData.id;

      // 2. HR queries notifications feed
      const notifyRes = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: hrCookie },
      });

      expect(notifyRes.status).toBe(200);
      const notifyData = (await notifyRes.json()) as any;

      const hrNotification = notifyData.notifications.find(
        (n: any) =>
          n.type === 'LEAVE_REQUEST' && n.message.includes('EMP-NOTIFY-01'),
      );
      expect(hrNotification).toBeDefined();
      expect(hrNotification.title).toContain('New Leave Request');
      expect(hrNotification.message).toContain('EMP-NOTIFY-01');
    });

    it('should trigger Employee notification when HR approves their leave request', async () => {
      // 1. HR reviews and approves leave
      const reviewRes = await fetch(
        `${testUrl}/api/leave/${leaveRequestId}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({ remarks: 'Get well soon' }),
        },
      );

      expect(reviewRes.status).toBe(200);

      // 2. Employee checks notifications feed
      const notifyRes = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: employeeCookie },
      });

      expect(notifyRes.status).toBe(200);
      const notifyData = (await notifyRes.json()) as any;

      expect(notifyData.notifications.length).toBeGreaterThanOrEqual(1);
      const empNotification = notifyData.notifications.find(
        (n: any) => n.type === 'LEAVE_STATUS',
      );
      expect(empNotification).toBeDefined();
      employeeNotificationId = empNotification.id;
      expect(empNotification.title).toBe('Leave Request Approved');
      expect(empNotification.read).toBe(false);
    });

    it('should trigger Employee notification when HR generates a salary slip', async () => {
      // 1. HR generates salary slip for employee
      const generateRes = await fetch(`${testUrl}/api/payroll/slip/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          employeeId: 'EMP-NOTIFY-01',
          month: '2026-08',
        }),
      });

      expect(generateRes.status).toBe(201);

      // 2. Employee checks notifications feed
      const notifyRes = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: employeeCookie },
      });

      expect(notifyRes.status).toBe(200);
      const notifyData = (await notifyRes.json()) as any;

      const payrollNotification = notifyData.notifications.find(
        (n: any) => n.type === 'PAYROLL_GENERATED',
      );
      expect(payrollNotification).toBeDefined();
      expect(payrollNotification.title).toBe('Payslip Generated');
    });

    it('should mark specific notification as read successfully', async () => {
      const readRes = await fetch(`${testUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          ids: [employeeNotificationId],
        }),
      });

      expect(readRes.status).toBe(200);
      const readData = (await readRes.json()) as any;
      expect(readData.success).toBe(true);

      // Verify status updated in feed
      const notifyRes = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: employeeCookie },
      });
      const notifyData = (await notifyRes.json()) as any;
      const target = notifyData.notifications.find(
        (n: any) => n.id === employeeNotificationId,
      );
      expect(target.read).toBe(true);
    });

    it('should mark all notifications as read if no ids parameter is passed', async () => {
      const readAllRes = await fetch(`${testUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
          'x-csrf-token': csrfToken,
        },
      });

      expect(readAllRes.status).toBe(200);

      // Verify all notifications are read in feed
      const notifyRes = await fetch(`${testUrl}/api/notifications`, {
        headers: { Cookie: employeeCookie },
      });
      const notifyData = (await notifyRes.json()) as any;
      notifyData.notifications.forEach((n: any) => {
        expect(n.read).toBe(true);
      });
    });
  });
});
