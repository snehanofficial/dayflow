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

describe('Analytics Module Integration Tests', () => {
  beforeAll(async () => {
    const pwdHash = await hashPassword('password123');

    // Clean up first (targeted only)
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-ANALYTICS-01', 'EMP-ANALYTICS-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-ANALYTICS-01', 'EMP-ANALYTICS-HR'] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'emp-analytics-test@example.com',
              'hr-analytics-test@example.com',
            ],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'emp-analytics-test@example.com',
            'hr-analytics-test@example.com',
          ],
        },
      },
    });

    // Create test users
    const empUser = await prisma.user.create({
      data: {
        email: 'emp-analytics-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-ANALYTICS-01',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });
    employeeUserId = empUser.id;

    const hrUser = await prisma.user.create({
      data: {
        email: 'hr-analytics-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-ANALYTICS-HR',
        role: 'HR',
        emailVerified: true,
      },
    });
    hrUserId = hrUser.id;

    // Create session tokens
    const empSession = await prisma.session.create({
      data: {
        userId: empUser.id,
        token: 'emp-analytics-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    employeeCookie = `sid=${empSession.token}`;

    const hrSession = await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: 'hr-analytics-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    hrCookie = `sid=${hrSession.token}`;

    // Seed HR analytics permission for tests
    await prisma.userPermission.create({
      data: {
        userId: hrUser.id,
        resource: 'analytics',
        action: 'read',
      },
    });

    // Seed test salary structures
    await prisma.salaryStructure.create({
      data: {
        employeeId: 'EMP-ANALYTICS-01',
        basicSalary: 4000,
        allowances: 800,
        deductions: 300,
        department: 'Engineering',
        designation: 'Engineer',
      },
    });

    await prisma.salaryStructure.create({
      data: {
        employeeId: 'EMP-ANALYTICS-HR',
        basicSalary: 6000,
        allowances: 1200,
        deductions: 500,
        department: 'Operations',
        designation: 'HR Lead',
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
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: ['EMP-ANALYTICS-01', 'EMP-ANALYTICS-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-ANALYTICS-01', 'EMP-ANALYTICS-HR'] } },
    });
    await prisma.userPermission.deleteMany({
      where: { userId: { in: [employeeUserId, hrUserId] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'emp-analytics-test@example.com',
              'hr-analytics-test@example.com',
            ],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'emp-analytics-test@example.com',
            'hr-analytics-test@example.com',
          ],
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

  describe('Security and Role Guards', () => {
    it('should deny Employee from loading analytics dashboard data', async () => {
      const response = await fetch(`${testUrl}/api/analytics/dashboard`, {
        headers: { Cookie: employeeCookie },
      });
      expect(response.status).toBe(403);
    });

    it('should deny Employee from loading reports list', async () => {
      const response = await fetch(
        `${testUrl}/api/analytics/reports?type=payroll`,
        {
          headers: { Cookie: employeeCookie },
        },
      );
      expect(response.status).toBe(403);
    });

    it('should deny unauthenticated requests', async () => {
      const response = await fetch(`${testUrl}/api/analytics/dashboard`);
      expect(response.status).toBe(401);
    });
  });

  describe('HR Analytics Dashboard Queries', () => {
    it('should load dashboard metrics and charts successfully as HR', async () => {
      const response = await fetch(`${testUrl}/api/analytics/dashboard`, {
        headers: { Cookie: hrCookie },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      // Assert metrics
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalEmployees).toBeGreaterThanOrEqual(2);
      expect(data.metrics.payrollTotal).toBeGreaterThanOrEqual(11200); // 4500 + 6700
      expect(data.metrics.attendancePercentage).toBeLessThanOrEqual(100);

      // Assert charts
      expect(data.charts).toBeDefined();
      expect(Array.isArray(data.charts.attendanceTrend)).toBe(true);
      expect(data.charts.attendanceTrend.length).toBe(7);
      expect(data.charts.leaveDistribution).toBeDefined();
      expect(Array.isArray(data.charts.departmentDistribution)).toBe(true);
      expect(Array.isArray(data.charts.payrollSummary)).toBe(true);
    });
  });

  describe('HR Report Queries', () => {
    it('should return payroll tabular report rows successfully', async () => {
      const response = await fetch(
        `${testUrl}/api/analytics/reports?type=payroll`,
        {
          headers: { Cookie: hrCookie },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      expect(data.type).toBe('payroll');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);

      const empRow = data.data.find(
        (r: any) => r.employeeId === 'EMP-ANALYTICS-01',
      );
      expect(empRow).toBeDefined();
      expect(empRow.basicSalary).toBe(4000);
      expect(empRow.netSalary).toBe(4500);
      expect(empRow.email).toBe('emp-analytics-test@example.com');
    });

    it('should return leave report rows successfully', async () => {
      const response = await fetch(
        `${testUrl}/api/analytics/reports?type=leave`,
        {
          headers: { Cookie: hrCookie },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      expect(data.type).toBe('leave');
      expect(Array.isArray(data.data)).toBe(true);

      const empRow = data.data.find(
        (r: any) => r.employeeId === 'EMP-ANALYTICS-01',
      );
      expect(empRow).toBeDefined();
      expect(empRow.approvedCount).toBe(0);
    });

    it('should return attendance report rows successfully', async () => {
      const response = await fetch(
        `${testUrl}/api/analytics/reports?type=attendance`,
        {
          headers: { Cookie: hrCookie },
        },
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      expect(data.type).toBe('attendance');
      expect(Array.isArray(data.data)).toBe(true);

      const empRow = data.data.find(
        (r: any) => r.employeeId === 'EMP-ANALYTICS-01',
      );
      expect(empRow).toBeDefined();
      expect(empRow.presentDays).toBeDefined();
      expect(empRow.attendancePercentage).toBeLessThanOrEqual(100);
    });

    it('should fail with 400 Bad Request on invalid report types', async () => {
      const response = await fetch(
        `${testUrl}/api/analytics/reports?type=invalid`,
        {
          headers: { Cookie: hrCookie },
        },
      );
      expect(response.status).toBe(400);
    });
  });
});
