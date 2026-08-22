import { prisma } from '../../core/database/index.js';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRepository {
  async findTodayAttendance(employeeId: string, attendanceDate: Date) {
    return prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
        },
      },
    });
  }

  async createAttendance(data: {
    employeeId: string;
    attendanceDate: Date;
    checkIn: Date;
    status: AttendanceStatus;
  }) {
    return prisma.attendance.create({
      data,
    });
  }

  async updateCheckOut(id: string, checkOut: Date) {
    return prisma.attendance.update({
      where: { id },
      data: { checkOut },
    });
  }

  async findHistory(params: {
    employeeId: string;
    limit: number;
    offset: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { employeeId, limit, offset, startDate, endDate } = params;

    const where: any = { employeeId };
    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) {
        where.attendanceDate.gte = startDate;
      }
      if (endDate) {
        where.attendanceDate.lte = endDate;
      }
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { attendanceDate: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countHistory(params: {
    employeeId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { employeeId, startDate, endDate } = params;

    const where: any = { employeeId };
    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) {
        where.attendanceDate.gte = startDate;
      }
      if (endDate) {
        where.attendanceDate.lte = endDate;
      }
    }

    return prisma.attendance.count({ where });
  }
}
