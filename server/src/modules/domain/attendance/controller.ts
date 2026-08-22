import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AttendanceService } from './service.js';
import { BadRequestError } from '../../core/errors/index.js';

const historyQuerySchema = z.object({
  limit: z
    .preprocess(
      (val) => (val ? parseInt(val as string, 10) : 50),
      z.number().int().min(1).max(100),
    )
    .default(50),
  offset: z
    .preprocess(
      (val) => (val ? parseInt(val as string, 10) : 0),
      z.number().int().min(0),
    )
    .default(0),
  startDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Invalid startDate format. Expected YYYY-MM-DD',
    )
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format. Expected YYYY-MM-DD')
    .optional(),
});

export class AttendanceController {
  private service = new AttendanceService();

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }

      const record = await this.service.checkIn(req.user.id);
      res.json({
        attendance: this.formatAttendance(record),
      });
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }

      const record = await this.service.checkOut(req.user.id);
      res.json({
        attendance: this.formatAttendance(record),
      });
    } catch (error) {
      next(error);
    }
  };

  getToday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }

      const record = await this.service.getTodayAttendance(req.user.id);
      res.json({
        attendance: record ? this.formatAttendance(record) : null,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }

      const parsedQuery = historyQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw new BadRequestError(
          parsedQuery.error.errors.map((e: z.ZodIssue) => e.message).join(', '),
        );
      }

      const { limit, offset, startDate, endDate } = parsedQuery.data;

      const { records, total } = await this.service.getHistory({
        userId: req.user.id,
        limit,
        offset,
        startDateStr: startDate,
        endDateStr: endDate,
      });

      res.json({
        history: records.map((r) => this.formatAttendance(r)),
        pagination: {
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private formatAttendance(record: any) {
    return {
      id: record.id,
      date: record.attendanceDate.toISOString().split('T')[0],
      checkIn: record.checkIn.toISOString(),
      checkOut: record.checkOut ? record.checkOut.toISOString() : null,
      status: record.status,
    };
  }
}
