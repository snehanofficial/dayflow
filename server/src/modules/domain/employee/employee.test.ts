import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { app } from '../../../app.js';
import { prisma } from '../../core/database/index.js';
import { hashPassword } from '../../core/auth/hash.js';

describe('Employee Domain Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  let employeeUser: any;
  let hrUser: any;
  let employeeSessionToken = 'session-emp-test-123';
  let hrSessionToken = 'session-hr-test-456';

  beforeAll(async () => {
    // Clean up existing test users/employees if they exist from past failed test runs
    await prisma.session.deleteMany({
      where: {
        token: { in: [employeeSessionToken, hrSessionToken] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['employee-test@example.com', 'hr-test@example.com'] },
      },
    });

    // Hash password
    const hashedPassword = await hashPassword('password123');

    // Create a regular employee
    employeeUser = await prisma.user.create({
      data: {
        email: 'employee-test@example.com',
        passwordHash: hashedPassword,
        employeeId: 'EMP-002',
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });

    await prisma.session.create({
      data: {
        userId: employeeUser.id,
        token: employeeSessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Create an HR user
    hrUser = await prisma.user.create({
      data: {
        email: 'hr-test@example.com',
        passwordHash: hashedPassword,
        employeeId: 'EMP-HR-002',
        role: 'HR',
        emailVerified: true,
      },
    });

    await prisma.session.create({
      data: {
        userId: hrUser.id,
        token: hrSessionToken,
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
    // Cleanup sessions & profiles
    await prisma.session.deleteMany({
      where: {
        token: { in: [employeeSessionToken, hrSessionToken] },
      },
    });
    await prisma.employee.deleteMany({
      where: {
        userId: { in: [employeeUser.id, hrUser.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [employeeUser.id, hrUser.id] },
      },
    });

    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/employee/profile', () => {
    it('should return 401 when request is not authenticated', async () => {
      const res = await fetch(`${testUrl}/api/employee/profile`);
      expect(res.status).toBe(401);
    });

    it('should return 200 and auto-initialize the employee profile if authenticated', async () => {
      const res = await fetch(`${testUrl}/api/employee/profile`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      expect(res.status).toBe(200);

      const profile = await res.json();
      expect(profile.employeeCode).toBe('EMP-002');
      expect(profile.firstName).toBe('');
      expect(profile.lastName).toBe('');
      expect(profile.userId).toBe(employeeUser.id);
    });
  });

  describe('PATCH /api/employee/profile', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await fetch(`${testUrl}/api/employee/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'test-csrf-token',
          Cookie: 'csrf-token=test-csrf-token',
        },
        body: JSON.stringify({ firstName: 'Jane', lastName: 'Doe' }),
      });
      expect(res.status).toBe(401);
    });

    it('should return 400 if validation fails', async () => {
      const res = await fetch(`${testUrl}/api/employee/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'test-csrf-token',
          Cookie: `sid=${employeeSessionToken}; csrf-token=test-csrf-token`,
        },
        body: JSON.stringify({ firstName: '', lastName: '' }),
      });
      expect(res.status).toBe(400);
    });

    it('should successfully update personal information and return updated profile', async () => {
      const res = await fetch(`${testUrl}/api/employee/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'test-csrf-token',
          Cookie: `sid=${employeeSessionToken}; csrf-token=test-csrf-token`,
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+15550199',
        }),
      });
      expect(res.status).toBe(200);

      const profile = await res.json();
      expect(profile.firstName).toBe('Jane');
      expect(profile.lastName).toBe('Doe');
      expect(profile.phone).toBe('+15550199');
    });
  });

  describe('GET /api/employees', () => {
    it('should return 403 if accessed by a regular employee role', async () => {
      const res = await fetch(`${testUrl}/api/employees`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('should return 200 and return list of profiles if accessed by HR', async () => {
      // First ensure HR profile is auto-initialized
      await fetch(`${testUrl}/api/employee/profile`, {
        headers: { Cookie: `sid=${hrSessionToken}` },
      });

      const res = await fetch(`${testUrl}/api/employees`, {
        headers: { Cookie: `sid=${hrSessionToken}` },
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.employees).toBeDefined();
      expect(body.employees.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return 403 if an employee tries to access another employee profile by ID', async () => {
      // Fetch HR employee record first to get its ID
      const hrInit = await fetch(`${testUrl}/api/employee/profile`, {
        headers: { Cookie: `sid=${hrSessionToken}` },
      });
      const hrProfile = await hrInit.json();

      const res = await fetch(`${testUrl}/api/employees/${hrProfile.id}`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('should return 200 if an employee requests their own profile by ID', async () => {
      const empInit = await fetch(`${testUrl}/api/employee/profile`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      const empProfile = await empInit.json();

      const res = await fetch(`${testUrl}/api/employees/${empProfile.id}`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      expect(res.status).toBe(200);

      const profile = await res.json();
      expect(profile.employeeCode).toBe('EMP-002');
    });

    it('should return 200 if HR requests any profile by ID', async () => {
      const empInit = await fetch(`${testUrl}/api/employee/profile`, {
        headers: { Cookie: `sid=${employeeSessionToken}` },
      });
      const empProfile = await empInit.json();

      const res = await fetch(`${testUrl}/api/employees/${empProfile.id}`, {
        headers: { Cookie: `sid=${hrSessionToken}` },
      });
      expect(res.status).toBe(200);

      const profile = await res.json();
      expect(profile.employeeCode).toBe('EMP-002');
    });

    it('should return 404 if profile does not exist', async () => {
      const res = await fetch(
        `${testUrl}/api/employees/00000000-0000-0000-0000-000000000000`,
        {
          headers: { Cookie: `sid=${hrSessionToken}` },
        },
      );
      expect(res.status).toBe(404);
    });
  });
});
