import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../app.js';
import { prisma } from '../core/database/index.js';
import { hashPassword } from '../core/auth/hash.js';

describe('Payroll Module Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  let employeeUserId: string;
  let hrUserId: string;
  let employeeCookie: string;
  let hrCookie: string;
  const csrfToken = 'payroll-test-csrf-token';

  beforeAll(async () => {
    const pwdHash = await hashPassword('password123');

    // Clean up first (targeted only)
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: ['EMP-PAYROLL-01', 'EMP-PAYROLL-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-PAYROLL-01', 'EMP-PAYROLL-HR'] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-payroll-test@example.com', 'hr-payroll-test@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['emp-payroll-test@example.com', 'hr-payroll-test@example.com'],
        },
      },
    });

    const empUser = await prisma.user.create({
      data: {
        email: 'emp-payroll-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-PAYROLL-01',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });
    employeeUserId = empUser.id;

    const hrUser = await prisma.user.create({
      data: {
        email: 'hr-payroll-test@example.com',
        passwordHash: pwdHash,
        employeeId: 'EMP-PAYROLL-HR',
        role: 'HR',
        emailVerified: true,
      },
    });
    hrUserId = hrUser.id;

    // Create session tokens
    const empSession = await prisma.session.create({
      data: {
        userId: empUser.id,
        token: 'emp-payroll-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    employeeCookie = `sid=${empSession.token}`;

    const hrSession = await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: 'hr-payroll-session-token',
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
    await prisma.salarySlip.deleteMany({
      where: { employeeId: { in: ['EMP-PAYROLL-01', 'EMP-PAYROLL-HR'] } },
    });
    await prisma.salaryStructure.deleteMany({
      where: { employeeId: { in: ['EMP-PAYROLL-01', 'EMP-PAYROLL-HR'] } },
    });
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: ['emp-payroll-test@example.com', 'hr-payroll-test@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['emp-payroll-test@example.com', 'hr-payroll-test@example.com'],
        },
      },
    });
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Salary Structure Operations (GET & PUT /api/payroll/salary-structure)', () => {
    it('should fail to configure salary structure if logged in as Employee', async () => {
      const response = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: 'EMP-PAYROLL-01',
          basicSalary: 5000,
          allowances: 1000,
          deductions: 500,
          department: 'Engineering',
          designation: 'Software Engineer',
        }),
      });

      expect(response.status).toBe(403);
    });

    it('should successfully configure salary structure if logged in as HR', async () => {
      const response = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: 'EMP-PAYROLL-01',
          basicSalary: 5000,
          allowances: 1200,
          deductions: 400,
          department: 'Engineering',
          designation: 'Developer',
        }),
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.employeeId).toBe('EMP-PAYROLL-01');
      expect(data.basicSalary).toBe(5000);
      expect(data.netSalary).toBe(5800); // 5000 + 1200 - 400
      expect(data.department).toBe('Engineering');
      expect(data.designation).toBe('Developer');
    });

    it('should allow Employee to fetch their own salary structure', async () => {
      const response = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        headers: { Cookie: employeeCookie },
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.employeeId).toBe('EMP-PAYROLL-01');
      expect(data.basicSalary).toBe(5000);
      expect(data.netSalary).toBe(5800);
    });

    it('should deny Employee from requesting another employee structure via header', async () => {
      const response = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        headers: {
          Cookie: employeeCookie,
          'x-employee-id': 'EMP-PAYROLL-HR',
        },
      });

      expect(response.status).toBe(403);
    });

    it('should allow HR to request any employee structure via header', async () => {
      const response = await fetch(`${testUrl}/api/payroll/salary-structure`, {
        headers: {
          Cookie: hrCookie,
          'x-employee-id': 'EMP-PAYROLL-01',
        },
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.employeeId).toBe('EMP-PAYROLL-01');
    });
  });

  describe('Salary Slip Operations (GET & POST /api/payroll/slips & slip/generate)', () => {
    let generatedSlipId: string;

    it('should fail to generate slip if logged in as Employee', async () => {
      const response = await fetch(`${testUrl}/api/payroll/slip/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${employeeCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: 'EMP-PAYROLL-01',
          month: '2026-08',
        }),
      });

      expect(response.status).toBe(403);
    });

    it('should successfully generate salary slip if logged in as HR', async () => {
      const response = await fetch(`${testUrl}/api/payroll/slip/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${hrCookie}; csrf-token=${csrfToken}`,
        },
        body: JSON.stringify({
          employeeId: 'EMP-PAYROLL-01',
          month: '2026-08',
        }),
      });

      expect(response.status).toBe(201);
      const data: any = await response.json();
      expect(data.id).toBeDefined();
      expect(data.employeeId).toBe('EMP-PAYROLL-01');
      expect(data.month).toBe('2026-08');
      expect(data.basicSalary).toBe(5000);
      expect(data.netSalary).toBe(5800);
      expect(data.department).toBe('Engineering');
      expect(data.designation).toBe('Developer');
      generatedSlipId = data.id;
    });

    it('should allow Employee to fetch their own slips list', async () => {
      const response = await fetch(`${testUrl}/api/payroll/slips`, {
        headers: { Cookie: employeeCookie },
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.slips).toBeDefined();
      expect(data.slips.length).toBe(1);
      expect(data.slips[0].id).toBe(generatedSlipId);
      expect(data.slips[0].user.email).toBe('emp-payroll-test@example.com');
    });

    it('should allow HR to fetch all slips', async () => {
      const response = await fetch(`${testUrl}/api/payroll/slips`, {
        headers: { Cookie: hrCookie },
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.slips).toBeDefined();
      expect(data.slips.length).toBeGreaterThan(0);
    });

    it('should allow Employee to fetch their own slip details', async () => {
      const response = await fetch(
        `${testUrl}/api/payroll/slip/${generatedSlipId}`,
        {
          headers: { Cookie: employeeCookie },
        },
      );

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.id).toBe(generatedSlipId);
      expect(data.netSalary).toBe(5800);
      expect(data.user.email).toBe('emp-payroll-test@example.com');
    });

    it('should deny Employee from querying another employee slip details', async () => {
      // Create a temporary slip for HR
      await prisma.salaryStructure.create({
        data: {
          employeeId: 'EMP-PAYROLL-HR',
          basicSalary: 6000,
          allowances: 1000,
          deductions: 500,
          department: 'HR',
          designation: 'HR Lead',
        },
      });

      const tempSlip = await prisma.salarySlip.create({
        data: {
          employeeId: 'EMP-PAYROLL-HR',
          month: '2026-08',
          basicSalary: 6000,
          allowances: 1000,
          deductions: 500,
          netSalary: 6500,
          department: 'HR',
          designation: 'HR Lead',
        },
      });

      const response = await fetch(
        `${testUrl}/api/payroll/slip/${tempSlip.id}`,
        {
          headers: { Cookie: employeeCookie },
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
