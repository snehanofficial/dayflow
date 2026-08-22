import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/index.js';
import { requireAuth, requireRole } from '../core/auth/middleware.js';
import { BadRequestError, NotFoundError } from '../core/errors/index.js';
import { z } from 'zod';

const router = Router();

const createRequestSchema = z.object({
  leaveType: z.enum(['PAID', 'SICK', 'UNPAID']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(1, 'Reason is required').max(500),
});

function calculateDays(startDate: Date, endDate: Date): number {
  const sDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const diffTime = eDate.getTime() - sDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * POST /api/leave/request
 * Submit a leave request (Employee)
 */
router.post(
  '/request',
  requireAuth,
  requireRole('EMPLOYEE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createRequestSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError('Invalid parameters', validation.error.format());
      }

      const { leaveType, startDate, endDate, reason } = validation.data;
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new BadRequestError('Start date cannot be after end date');
      }

      const request = await prisma.leaveRequest.create({
        data: {
          employeeId: req.user!.employeeId,
          leaveType,
          startDate: start,
          endDate: end,
          reason,
          status: 'PENDING',
        },
      });

      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leave/my-requests
 * Retrieve own leave requests (Employee)
 */
router.get(
  '/my-requests',
  requireAuth,
  requireRole('EMPLOYEE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await prisma.leaveRequest.findMany({
        where: {
          employeeId: req.user!.employeeId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leave/balance
 * Retrieve own leave balance (Employee)
 */
router.get(
  '/balance',
  requireAuth,
  requireRole('EMPLOYEE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approvedRequests = await prisma.leaveRequest.findMany({
        where: {
          employeeId: req.user!.employeeId,
          status: 'APPROVED',
        },
      });

      let paidUsed = 0;
      let sickUsed = 0;
      let unpaidUsed = 0;

      for (const reqObj of approvedRequests) {
        const days = calculateDays(reqObj.startDate, reqObj.endDate);
        if (reqObj.leaveType === 'PAID') {
          paidUsed += days;
        } else if (reqObj.leaveType === 'SICK') {
          sickUsed += days;
        } else if (reqObj.leaveType === 'UNPAID') {
          unpaidUsed += days;
        }
      }

      res.json({
        paid: {
          allocated: 15,
          used: paidUsed,
          remaining: Math.max(0, 15 - paidUsed),
        },
        sick: {
          allocated: 10,
          used: sickUsed,
          remaining: Math.max(0, 10 - sickUsed),
        },
        unpaid: {
          allocated: 0,
          used: unpaidUsed,
          remaining: 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leave/all
 * Retrieve all leave requests (HR)
 */
router.get(
  '/all',
  requireAuth,
  requireRole('HR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await prisma.leaveRequest.findMany({
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/leave/:id/approve
 * Approve a leave request (HR)
 */
router.patch(
  '/:id/approve',
  requireAuth,
  requireRole('HR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id },
      });

      if (!leaveRequest) {
        throw new NotFoundError('Leave request not found');
      }

      if (leaveRequest.status !== 'PENDING') {
        throw new BadRequestError('Only pending leave requests can be approved');
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          remarks: remarks || null,
          approvedBy: req.user!.employeeId,
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/leave/:id/reject
 * Reject a leave request (HR)
 */
router.patch(
  '/:id/reject',
  requireAuth,
  requireRole('HR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body || {};

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id },
      });

      if (!leaveRequest) {
        throw new NotFoundError('Leave request not found');
      }

      if (leaveRequest.status !== 'PENDING') {
        throw new BadRequestError('Only pending leave requests can be rejected');
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          remarks: remarks || null,
          approvedBy: req.user!.employeeId,
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

export { router as leaveRouter };
