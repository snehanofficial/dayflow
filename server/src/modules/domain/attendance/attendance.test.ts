import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Server } from 'http';
import { app } from '../../../app.js';
import { prisma } from '../../core/database/index.js';
import { hashPassword } from '../../core/auth/hash.js';
import { AttendanceService } from './service.js';
import {
  getCurrentAttendanceDate,
  isLateCheckIn,
} from '../../core/utils/date.js';

describe('Attendance Domain Integration Tests', () => {
  let server: Server;
  let testUrl: string;
  let employeeUser1: any;
  let employeeUser2: any;
  let employeeSessionToken1 = 'session-emp-attn-111';
  let employeeSessionToken2 = 'session-emp-attn-222';
  let service: AttendanceService;

  beforeAll(async () => {
    service = new AttendanceService();

    // Cleanup from any previous aborted runs
    await prisma.attendance.deleteMany({});
    await prisma.session.deleteMany({
      where: {
        token: { in: [employeeSessionToken1, employeeSessionToken2] },
      },
    });
    await prisma.employee.deleteMany({
      where: {
        employeeCode: { in: ['EMP-ATT-01', 'EMP-ATT-02'] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['emp1-attn@example.com', 'emp2-attn@example.com'] },
      },
    });

    const hashedPassword = await hashPassword('password123');

    // Create Employee 1
    employeeUser1 = await prisma.user.create({
      data: {
        email: 'emp1-attn@example.com',
        passwordHash: hashedPassword,
        employeeId: 'EMP-ATT-01',
        role: 'EMPLOYEE',
        emailVerified: true,
        employee: {
          create: {
            employeeCode: 'EMP-ATT-01',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
      include: { employee: true },
    });

    await prisma.session.create({
      data: {
        userId: employeeUser1.id,
        token: employeeSessionToken1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Create Employee 2
    employeeUser2 = await prisma.user.create({
      data: {
        email: 'emp2-attn@example.com',
        passwordHash: hashedPassword,
        employeeId: 'EMP-ATT-02',
        role: 'EMPLOYEE',
        emailVerified: true,
        employee: {
          create: {
            employeeCode: 'EMP-ATT-02',
            firstName: 'Alice',
            lastName: 'Smith',
          },
        },
      },
      include: { employee: true },
    });

    await prisma.session.create({
      data: {
        userId: employeeUser2.id,
        token: employeeSessionToken2,
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
    await prisma.attendance.deleteMany({});
    await prisma.session.deleteMany({
      where: {
        token: { in: [employeeSessionToken1, employeeSessionToken2] },
      },
    });
    await prisma.employee.deleteMany({
      where: {
        employeeCode: { in: ['EMP-ATT-01', 'EMP-ATT-02'] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [employeeUser1.id, employeeUser2.id] },
      },
    });

    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(async () => {
    // Clear attendance records before each test to start with clean state
    await prisma.attendance.deleteMany({});
  });

  describe('Unauthenticated API Security Boundaries', () => {
    it('should return 401 for check-in without authentication', async () => {
      const res = await fetch(`${testUrl}/api/attendance/check-in`, {
        method: 'POST',
        headers: {
          'x-csrf-token': 'test-csrf-token',
          Cookie: 'csrf-token=test-csrf-token',
        },
      });
      expect(res.status).toBe(401);
    });

    it('should return 401 for check-out without authentication', async () => {
      const res = await fetch(`${testUrl}/api/attendance/check-out`, {
        method: 'POST',
        headers: {
          'x-csrf-token': 'test-csrf-token',
          Cookie: 'csrf-token=test-csrf-token',
        },
      });
      expect(res.status).toBe(401);
    });

    it('should return 401 for today attendance status without authentication', async () => {
      const res = await fetch(`${testUrl}/api/attendance/today`);
      expect(res.status).toBe(401);
    });

    it('should return 401 for history logs without authentication', async () => {
      const res = await fetch(`${testUrl}/api/attendance/history`);
      expect(res.status).toBe(401);
    });
  });

  describe('Employee Self-Service check-in/out and duplicate blocks', () => {
    it('should successfully check in, fetch status, check out, and verify states', async () => {
      // 1. Initial status is null
      const initialStatusRes = await fetch(`${testUrl}/api/attendance/today`, {
        headers: { Cookie: `sid=${employeeSessionToken1}` },
      });
      expect(initialStatusRes.status).toBe(200);
      const initialStatus = await initialStatusRes.json();
      expect(initialStatus.attendance).toBeNull();

      // 2. Check-in
      const checkInRes = await fetch(`${testUrl}/api/attendance/check-in`, {
        method: 'POST',
        headers: {
          Cookie: `sid=${employeeSessionToken1}; csrf-token=test-csrf-token`,
          'x-csrf-token': 'test-csrf-token',
        },
      });
      expect(checkInRes.status).toBe(200);
      const checkInBody = await checkInRes.json();
      expect(checkInBody.attendance).toBeDefined();
      expect(checkInBody.attendance.checkIn).toBeDefined();
      expect(checkInBody.attendance.checkOut).toBeNull();
      expect(checkInBody.attendance.status).toMatch(/PRESENT|LATE/);

      // 3. Duplicate check-in blocked
      const dupCheckInRes = await fetch(`${testUrl}/api/attendance/check-in`, {
        method: 'POST',
        headers: {
          Cookie: `sid=${employeeSessionToken1}; csrf-token=test-csrf-token`,
          'x-csrf-token': 'test-csrf-token',
        },
      });
      expect(dupCheckInRes.status).toBe(400);

      // 4. Check status today returns checking in info
      const todayRes = await fetch(`${testUrl}/api/attendance/today`, {
        headers: { Cookie: `sid=${employeeSessionToken1}` },
      });
      expect(todayRes.status).toBe(200);
      const todayBody = await todayRes.json();
      expect(todayBody.attendance.checkIn).toBeDefined();
      expect(todayBody.attendance.checkOut).toBeNull();

      // 5. Check-out
      const checkOutRes = await fetch(`${testUrl}/api/attendance/check-out`, {
        method: 'POST',
        headers: {
          Cookie: `sid=${employeeSessionToken1}; csrf-token=test-csrf-token`,
          'x-csrf-token': 'test-csrf-token',
        },
      });
      expect(checkOutRes.status).toBe(200);
      const checkOutBody = await checkOutRes.json();
      expect(checkOutBody.attendance.checkOut).not.toBeNull();

      // 6. Duplicate check-out blocked
      const dupCheckOutRes = await fetch(
        `${testUrl}/api/attendance/check-out`,
        {
          method: 'POST',
          headers: {
            Cookie: `sid=${employeeSessionToken1}; csrf-token=test-csrf-token`,
            'x-csrf-token': 'test-csrf-token',
          },
        },
      );
      expect(dupCheckOutRes.status).toBe(400);
    });

    it('should block check-out without prior check-in', async () => {
      const res = await fetch(`${testUrl}/api/attendance/check-out`, {
        method: 'POST',
        headers: {
          Cookie: `sid=${employeeSessionToken1}; csrf-token=test-csrf-token`,
          'x-csrf-token': 'test-csrf-token',
        },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.message).toContain(
        'No check-in record found for today',
      );
    });
  });

  describe('Database Unique Constraints Concurrency Protection', () => {
    it('should catch database unique constraint and transform to BadRequestError', async () => {
      const attendanceDate = getCurrentAttendanceDate();

      // Directly invoke repository create to bypass service checks
      await prisma.attendance.create({
        data: {
          employeeId: employeeUser1.employee.id,
          attendanceDate,
          checkIn: new Date(),
          status: 'PRESENT',
        },
      });

      // Try checking in via the service method directly to trigger and catch the database violation
      await expect(service.checkIn(employeeUser1.id)).rejects.toThrow(
        'Already checked in today',
      );
    });
  });

  describe('Ownership Boundaries', () => {
    it("should prevent an employee from seeing another employee's logs", async () => {
      // 1. Employee 1 checks in
      await service.checkIn(employeeUser1.id);

      // 2. Employee 2 requests history
      const res = await fetch(`${testUrl}/api/attendance/history`, {
        headers: { Cookie: `sid=${employeeSessionToken2}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();

      // Employee 2 should have 0 records in history
      expect(body.history.length).toBe(0);
    });
  });

  describe('Date Filtering Range & Pagination validation', () => {
    it('should reject requests with invalid date formats', async () => {
      const res = await fetch(
        `${testUrl}/api/attendance/history?startDate=invalid-date`,
        {
          headers: { Cookie: `sid=${employeeSessionToken1}` },
        },
      );
      expect(res.status).toBe(400);
    });

    it('should reject requests where startDate > endDate', async () => {
      const res = await fetch(
        `${testUrl}/api/attendance/history?startDate=2026-08-25&endDate=2026-08-20`,
        {
          headers: { Cookie: `sid=${employeeSessionToken1}` },
        },
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.message).toContain(
        'Start date must be less than or equal to end date',
      );
    });
  });

  describe('Timezone & Late Threshold Rules Boundary Calculations', () => {
    it('should correctly mark check-in at 09:00 local time as PRESENT', () => {
      // Let's create a date corresponding to exactly 09:00:00 local time in Asia/Kolkata
      // India is UTC+5:30, so 09:00 IST is 03:30 UTC.
      const dateStr = '2026-08-22T03:30:00.000Z'; // 09:00 IST
      const mockCheckIn = new Date(dateStr);
      expect(isLateCheckIn(mockCheckIn)).toBe(false);
    });

    it('should correctly mark check-in at 08:59 local time as PRESENT', () => {
      const dateStr = '2026-08-22T03:29:00.000Z'; // 08:59 IST
      const mockCheckIn = new Date(dateStr);
      expect(isLateCheckIn(mockCheckIn)).toBe(false);
    });

    it('should correctly mark check-in at 09:01 local time as LATE', () => {
      const dateStr = '2026-08-22T03:31:00.000Z'; // 09:01 IST
      const mockCheckIn = new Date(dateStr);
      expect(isLateCheckIn(mockCheckIn)).toBe(true);
    });

    it('should correctly allocate calendar dates around midnight boundaries in Asia/Kolkata', () => {
      // 23:59 IST is 18:29 UTC
      const checkIn1 = new Date('2026-08-22T18:29:00.000Z');
      const calendarDate1 = getCurrentAttendanceDate(checkIn1);
      // Calendar date should be 2026-08-22
      expect(calendarDate1.getUTCDate()).toBe(22);
      expect(calendarDate1.getUTCMonth()).toBe(7); // August is index 7

      // 00:01 IST (next day) is 18:31 UTC (still on 22nd in UTC)
      const checkIn2 = new Date('2026-08-22T18:31:00.000Z');
      const calendarDate2 = getCurrentAttendanceDate(checkIn2);
      // Calendar date should correctly roll over to 2026-08-23
      expect(calendarDate2.getUTCDate()).toBe(23);
      expect(calendarDate2.getUTCMonth()).toBe(7);
    });
  });

  describe('Attendance Insights API & Logic', () => {
    it('should return 401 for insights request without authentication', async () => {
      const res = await fetch(
        `${testUrl}/api/attendance/insights?startDate=2026-08-01&endDate=2026-08-31`,
      );
      expect(res.status).toBe(401);
    });

    it('should reject requests with missing dates', async () => {
      const res = await fetch(`${testUrl}/api/attendance/insights`, {
        headers: { Cookie: `sid=${employeeSessionToken1}` },
      });
      expect(res.status).toBe(400);
    });

    it('should reject requests where startDate > endDate', async () => {
      const res = await fetch(
        `${testUrl}/api/attendance/insights?startDate=2026-08-25&endDate=2026-08-20`,
        {
          headers: { Cookie: `sid=${employeeSessionToken1}` },
        },
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.message).toContain(
        'Start date must be less than or equal to end date',
      );
    });

    it('should return correctly aggregated metrics for the selected period', async () => {
      // Create mock attendance records directly in the DB
      await prisma.attendance.createMany({
        data: [
          {
            employeeId: employeeUser1.employee.id,
            attendanceDate: new Date('2026-08-01T00:00:00.000Z'),
            checkIn: new Date('2026-08-01T08:30:00.000Z'),
            status: 'PRESENT',
          },
          {
            employeeId: employeeUser1.employee.id,
            attendanceDate: new Date('2026-08-02T00:00:00.000Z'),
            checkIn: new Date('2026-08-02T09:15:00.000Z'),
            status: 'LATE',
          },
        ],
      });

      // Fetch insights
      const res = await fetch(
        `${testUrl}/api/attendance/insights?startDate=2026-08-01&endDate=2026-08-02`,
        {
          headers: { Cookie: `sid=${employeeSessionToken1}` },
        },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.summary.recordedDays).toBe(2);
      expect(body.summary.presentDays).toBe(1);
      expect(body.summary.lateDays).toBe(1);
      expect(body.summary.onTimeRate).toBe(50); // 1 / 2 * 100
      expect(body.breakdown).toHaveLength(2);
      expect(body.breakdown[0].date).toBe('2026-08-01');
      expect(body.breakdown[0].status).toBe('PRESENT');
      expect(body.breakdown[1].date).toBe('2026-08-02');
      expect(body.breakdown[1].status).toBe('LATE');
    });

    it('should return null onTimeRate when recordedDays is 0', async () => {
      const res = await fetch(
        `${testUrl}/api/attendance/insights?startDate=2026-09-01&endDate=2026-09-30`,
        {
          headers: { Cookie: `sid=${employeeSessionToken1}` },
        },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.summary.recordedDays).toBe(0);
      expect(body.summary.onTimeRate).toBeNull();
      expect(body.breakdown).toHaveLength(0);
    });

    it('should enforce employee data isolation', async () => {
      // Employee 1 has records, Employee 2 has none
      await prisma.attendance.create({
        data: {
          employeeId: employeeUser1.employee.id,
          attendanceDate: new Date('2026-08-01T00:00:00.000Z'),
          checkIn: new Date('2026-08-01T08:30:00.000Z'),
          status: 'PRESENT',
        },
      });

      // Employee 2 requests insights
      const res = await fetch(
        `${testUrl}/api/attendance/insights?startDate=2026-08-01&endDate=2026-08-31`,
        {
          headers: { Cookie: `sid=${employeeSessionToken2}` },
        },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      // Employee 2 should have 0 records despite Employee 1 having records
      expect(body.summary.recordedDays).toBe(0);
    });
  });
});
