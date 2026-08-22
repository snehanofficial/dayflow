import { config } from '../config/index.js';
import { BadRequestError } from '../errors/index.js';

/**
 * Returns a UTC midnight Date representing the current calendar date in the configured ATTENDANCE_TIMEZONE.
 * Can accept an optional specific Date object for mock/test cases.
 */
export function getCurrentAttendanceDate(nowInput?: Date): Date {
  const dateToUse = nowInput || new Date();
  const timeZone = config.ATTENDANCE_TIMEZONE;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(dateToUse);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to resolve timezone parts from Date');
  }

  // Returns YYYY-MM-DDT00:00:00.000Z
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

/**
 * Checks if a given check-in time is after the ATTENDANCE_LATE_AFTER threshold.
 * Uses the configured ATTENDANCE_TIMEZONE for timezone-aware time conversion.
 */
export function isLateCheckIn(checkInTime: Date): boolean {
  const timeZone = config.ATTENDANCE_TIMEZONE;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const timeStr = formatter.format(checkInTime); // "HH:MM"
  const [h, m] = timeStr.split(':').map(Number);
  const [limitHour, limitMinute] =
    config.ATTENDANCE_LATE_AFTER.split(':').map(Number);

  const checkInMinutes = h * 60 + m;
  const limitMinutes = limitHour * 60 + limitMinute;

  return checkInMinutes > limitMinutes;
}

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object representing the calendar date.
 */
export function parseAttendanceDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new BadRequestError('Invalid date format. Expected YYYY-MM-DD');
  }

  const [_, y, m, d] = match;
  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);

  // Return UTC midnight
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Validates and returns parsed start and end Date objects for range query filtering.
 * Throws a BadRequestError if startDate is after endDate.
 */
export function getAttendanceDateRange(
  startDateStr?: string,
  endDateStr?: string,
): { startDate?: Date; endDate?: Date } {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateStr) {
    startDate = parseAttendanceDate(startDateStr);
  }

  if (endDateStr) {
    endDate = parseAttendanceDate(endDateStr);
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new BadRequestError(
      'Start date must be less than or equal to end date',
    );
  }

  return { startDate, endDate };
}
