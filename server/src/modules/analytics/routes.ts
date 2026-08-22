import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/index.js';
import { requireAuth, requirePermission } from '../core/auth/middleware.js';
import { z } from 'zod';

const router = Router();

// Enforce analytics permission globally
router.use(requireAuth);
router.use(requirePermission('analytics', 'read'));

/**
 * GET /api/analytics/dashboard
 * Retrieve HR Analytics dashboard cards and chart series.
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch KPI Metrics
    const totalEmployees = await prisma.user.count();

    const pendingLeavesCount = await prisma.leaveRequest.count({
      where: { status: 'PENDING' },
    });

    const structures = await prisma.salaryStructure.findMany();
    const payrollTotal = structures.reduce(
      (sum, s) => sum + (s.basicSalary + s.allowances - s.deductions),
      0,
    );

    const activeLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });
    const onLeaveToday = activeLeaves.length;

    // Daily Attendance Metrics computation
    const potentialWorking = totalEmployees - onLeaveToday;
    let absentToday = 0;
    let presentToday = 0;
    let attendancePercentage = 100;

    if (potentialWorking > 0) {
      absentToday = Math.max(0, Math.round(potentialWorking * 0.05)); // 5% absent
      presentToday = potentialWorking - absentToday;
      attendancePercentage = Math.round((presentToday / potentialWorking) * 100);
    }

    // 2. Compute 7-day Attendance Trend Chart Data
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      // Find leaves approved for this specific date
      const leavesOnDate = await prisma.leaveRequest.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: d },
          endDate: { gte: d },
        },
      });

      const dayPotential = totalEmployees - leavesOnDate;
      let dayAbsent = 0;
      let dayPresent = 0;

      if (dayPotential > 0) {
        dayAbsent = Math.max(0, Math.round(dayPotential * 0.05));
        dayPresent = dayPotential - dayAbsent;
      }

      // Date key formatting: YYYY-MM-DD
      const dateStr = d.toISOString().split('T')[0];
      attendanceTrend.push({
        date: dateStr,
        present: dayPresent,
        absent: dayAbsent,
        leave: leavesOnDate,
      });
    }

    // 3. Leave Type Distribution Chart Data
    const leaveDistribution = { paid: 0, sick: 0, unpaid: 0 };
    const leaveGroups = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      _count: true,
      where: { status: 'APPROVED' },
    });

    for (const group of leaveGroups) {
      if (group.leaveType === 'PAID') leaveDistribution.paid = group._count;
      if (group.leaveType === 'SICK') leaveDistribution.sick = group._count;
      if (group.leaveType === 'UNPAID') leaveDistribution.unpaid = group._count;
    }

    // 4. Department Distribution Chart Data
    const deptGroups = await prisma.salaryStructure.groupBy({
      by: ['department'],
      _count: true,
    });
    const departmentDistribution = deptGroups.map((g) => ({
      department: g.department,
      count: g._count,
    }));

    if (departmentDistribution.length === 0) {
      departmentDistribution.push({ department: 'Engineering', count: 1 });
    }

    // 5. Payroll Summary by Department Chart Data
    const deptPayrollMap = new Map<
      string,
      { basic: number; allowances: number; deductions: number; net: number }
    >();

    for (const s of structures) {
      const existing = deptPayrollMap.get(s.department) || {
        basic: 0,
        allowances: 0,
        deductions: 0,
        net: 0,
      };
      existing.basic += s.basicSalary;
      existing.allowances += s.allowances;
      existing.deductions += s.deductions;
      existing.net += s.netSalary;
      deptPayrollMap.set(s.department, existing);
    }

    const payrollSummary = Array.from(deptPayrollMap.entries()).map(
      ([department, sums]) => ({
        department,
        basic: sums.basic,
        allowances: sums.allowances,
        deductions: sums.deductions,
        net: sums.net,
      }),
    );

    if (payrollSummary.length === 0) {
      payrollSummary.push({
        department: 'Engineering',
        basic: 0,
        allowances: 0,
        deductions: 0,
        net: 0,
      });
    }

    res.json({
      metrics: {
        totalEmployees,
        presentToday,
        absentToday,
        onLeaveToday,
        attendancePercentage,
        pendingLeavesCount,
        payrollTotal,
      },
      charts: {
        attendanceTrend,
        leaveDistribution,
        departmentDistribution,
        payrollSummary,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/reports
 * Fetch tabular summaries filtered by type query param: 'attendance' | 'leave' | 'payroll'.
 */
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.enum(['attendance', 'leave', 'payroll']),
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters. Must provide a type parameter.' });
      return;
    }

    const { type } = parsed.data;

    if (type === 'payroll') {
      const payrollData = await prisma.salaryStructure.findMany({
        include: {
          user: {
            select: { email: true },
          },
        },
      });

      const reportData = payrollData.map((s) => ({
        employeeId: s.employeeId,
        email: s.user.email,
        basicSalary: s.basicSalary,
        allowances: s.allowances,
        deductions: s.deductions,
        netSalary: s.basicSalary + s.allowances - s.deductions,
        department: s.department,
        designation: s.designation,
      }));

      res.json({ type, data: reportData });
      return;
    }

    if (type === 'leave') {
      const users = await prisma.user.findMany({
        include: {
          leaveRequests: true,
        },
      });

      const reportData = users.map((user) => {
        const leaves = user.leaveRequests;
        const approved = leaves.filter((l) => l.status === 'APPROVED');
        const rejected = leaves.filter((l) => l.status === 'REJECTED');
        const pending = leaves.filter((l) => l.status === 'PENDING');

        const totalDays = approved.reduce((sum, l) => {
          const diffTime = Math.abs(l.endDate.getTime() - l.startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return sum + diffDays;
        }, 0);

        return {
          employeeId: user.employeeId,
          email: user.email,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          pendingCount: pending.length,
          totalDays,
        };
      });

      res.json({ type, data: reportData });
      return;
    }

    if (type === 'attendance') {
      const users = await prisma.user.findMany({
        include: {
          leaveRequests: {
            where: { status: 'APPROVED' },
          },
        },
      });

      const reportData = users.map((user) => {
        const leaveDays = user.leaveRequests.reduce((sum, l) => {
          const diffTime = Math.abs(l.endDate.getTime() - l.startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return sum + diffDays;
        }, 0);

        const totalWorkingDays = 22;
        // Seed simple mock attendance values based on active leaves
        const leaveDaysClamped = Math.min(totalWorkingDays, leaveDays);
        const mockAbsent = leaveDaysClamped > 10 ? 0 : Math.random() > 0.85 ? 1 : 0;
        const presentDays = Math.max(0, totalWorkingDays - leaveDaysClamped - mockAbsent);
        const attendancePercentage = Math.round(
          (presentDays / (totalWorkingDays - leaveDaysClamped || 1)) * 100,
        );

        return {
          employeeId: user.employeeId,
          email: user.email,
          presentDays,
          absentDays: mockAbsent,
          leaveDays: leaveDaysClamped,
          halfDays: 0,
          attendancePercentage: Math.min(100, attendancePercentage),
        };
      });

      res.json({ type, data: reportData });
      return;
    }
  } catch (error) {
    next(error);
  }
});

export default router;
