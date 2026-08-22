import { AttendanceRepository } from './repository.js';
import { EmployeeRepository } from '../employee/index.js';
import { NotFoundError, BadRequestError } from '../../core/errors/index.js';
import {
  getCurrentAttendanceDate,
  isLateCheckIn,
  getAttendanceDateRange,
} from '../../core/utils/index.js';

export class AttendanceService {
  private repository = new AttendanceRepository();
  private employeeRepo = new EmployeeRepository();

  async checkIn(userId: string, customTime?: Date) {
    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    const checkInTime = customTime || new Date();
    // Resolve current calendar date using configured attendance timezone
    const attendanceDate = getCurrentAttendanceDate(checkInTime);

    // Application level duplicate check
    const existing = await this.repository.findTodayAttendance(
      employee.id,
      attendanceDate,
    );
    if (existing) {
      throw new BadRequestError('Already checked in today');
    }

    // Determine status: check if check-in is after LATE_AFTER cutoff
    const isLate = isLateCheckIn(checkInTime);
    const status = isLate ? 'LATE' : 'PRESENT';

    try {
      return await this.repository.createAttendance({
        employeeId: employee.id,
        attendanceDate,
        checkIn: checkInTime,
        status,
      });
    } catch (err: any) {
      // Catch duplicate key unique constraint conflict (P2002)
      if (err.code === 'P2002') {
        throw new BadRequestError('Already checked in today');
      }
      throw err;
    }
  }

  async checkOut(userId: string, customTime?: Date) {
    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    const checkOutTime = customTime || new Date();
    // Resolve attendance date for checkout context (matching checkout calendar day)
    const attendanceDate = getCurrentAttendanceDate(checkOutTime);

    const todayRecord = await this.repository.findTodayAttendance(
      employee.id,
      attendanceDate,
    );
    if (!todayRecord) {
      throw new BadRequestError('No check-in record found for today');
    }

    if (todayRecord.checkOut) {
      throw new BadRequestError('Already checked out today');
    }

    return this.repository.updateCheckOut(todayRecord.id, checkOutTime);
  }

  async getTodayAttendance(userId: string, customTime?: Date) {
    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    const attendanceDate = getCurrentAttendanceDate(customTime);
    return this.repository.findTodayAttendance(employee.id, attendanceDate);
  }

  async getHistory(params: {
    userId: string;
    limit: number;
    offset: number;
    startDateStr?: string;
    endDateStr?: string;
  }) {
    const { userId, limit, offset, startDateStr, endDateStr } = params;

    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    // Parse and validate date filters
    const { startDate, endDate } = getAttendanceDateRange(
      startDateStr,
      endDateStr,
    );

    const records = await this.repository.findHistory({
      employeeId: employee.id,
      limit,
      offset,
      startDate,
      endDate,
    });

    const total = await this.repository.countHistory({
      employeeId: employee.id,
      startDate,
      endDate,
    });

    return { records, total };
  }

  async getInsights(params: {
    userId: string;
    startDateStr: string;
    endDateStr: string;
  }) {
    const { userId, startDateStr, endDateStr } = params;

    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    const { startDate, endDate } = getAttendanceDateRange(
      startDateStr,
      endDateStr,
    );

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    // 1. Fetch grouping counts by status
    const summaryCounts = await this.repository.findInsightsSummary({
      employeeId: employee.id,
      startDate,
      endDate,
    });

    // 2. Fetch daily chronological breakdown
    const breakdownRecords = await this.repository.findInsightsBreakdown({
      employeeId: employee.id,
      startDate,
      endDate,
    });

    // Calculate metrics
    const presentCount =
      summaryCounts.find((s) => s.status === 'PRESENT')?._count.status || 0;
    const lateCount =
      summaryCounts.find((s) => s.status === 'LATE')?._count.status || 0;
    const halfDayCount =
      summaryCounts.find((s) => s.status === 'HALF_DAY')?._count.status || 0;
    const absentCount =
      summaryCounts.find((s) => s.status === 'ABSENT')?._count.status || 0;

    // Total recorded days is the sum of all statuses
    const recordedDays = summaryCounts.reduce(
      (acc, curr) => acc + curr._count.status,
      0,
    );

    // Calculate On-Time Rate: Present Days / Recorded Days * 100
    // Return null if recordedDays === 0
    let onTimeRate: number | null = null;
    if (recordedDays > 0) {
      onTimeRate = Math.round((presentCount / recordedDays) * 100 * 10) / 10;
    }

    return {
      period: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      summary: {
        recordedDays,
        presentDays: presentCount,
        lateDays: lateCount,
        halfDayDays: halfDayCount,
        absentDays: absentCount,
        onTimeRate,
      },
      breakdown: breakdownRecords.map((r) => ({
        date: r.attendanceDate.toISOString().split('T')[0],
        status: r.status,
      })),
    };
  }
}
