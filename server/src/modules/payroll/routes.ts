import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/index.js';
import { requireAuth, requireRole } from '../core/auth/middleware.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../core/errors/index.js';
import { z } from 'zod';

const router = Router();

const configureStructureSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  basicSalary: z.number().nonnegative('Basic salary must be 0 or greater'),
  allowances: z.number().nonnegative('Allowances must be 0 or greater'),
  deductions: z.number().nonnegative('Deductions must be 0 or greater'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
});

const generateSlipSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

/**
 * GET /api/payroll/salary-structure
 * Retrieve salary structure (Employee views own; HR can retrieve any via query param)
 */
router.get(
  '/salary-structure',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.query;
      let targetEmployeeId = req.user!.employeeId;

      if (employeeId && typeof employeeId === 'string') {
        if (req.user!.role !== 'HR' && employeeId !== req.user!.employeeId) {
          throw new ForbiddenError('Access denied: Unauthorized role');
        }
        targetEmployeeId = employeeId;
      }

      const structure = await prisma.salaryStructure.findUnique({
        where: { employeeId: targetEmployeeId },
      });

      if (!structure) {
        throw new NotFoundError('Salary structure not found');
      }

      const netSalary = structure.basicSalary + structure.allowances - structure.deductions;
      res.json({
        ...structure,
        netSalary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/payroll/salary-structure
 * Create or update salary structure (HR only)
 */
router.put(
  '/salary-structure',
  requireAuth,
  requireRole('HR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = configureStructureSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError('Invalid parameters', validation.error.format());
      }

      const { employeeId, basicSalary, allowances, deductions, department, designation } = validation.data;

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { employeeId },
      });

      if (!targetUser) {
        throw new BadRequestError('Employee user not found');
      }

      const structure = await prisma.salaryStructure.upsert({
        where: { employeeId },
        update: {
          basicSalary,
          allowances,
          deductions,
          department,
          designation,
        },
        create: {
          employeeId,
          basicSalary,
          allowances,
          deductions,
          department,
          designation,
        },
      });

      const netSalary = structure.basicSalary + structure.allowances - structure.deductions;
      res.json({
        ...structure,
        netSalary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payroll/slips
 * Retrieve salary slips list (Employee views own; HR views all)
 */
router.get(
  '/slips',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.query;
      const where: any = {};

      if (req.user!.role !== 'HR') {
        where.employeeId = req.user!.employeeId;
      } else if (employeeId && typeof employeeId === 'string') {
        where.employeeId = employeeId;
      }

      const slips = await prisma.salarySlip.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          month: 'desc',
        },
      });

      res.json({ slips });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payroll/slip/generate
 * Generate salary slip for month (HR only)
 */
router.post(
  '/slip/generate',
  requireAuth,
  requireRole('HR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = generateSlipSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError('Invalid parameters', validation.error.format());
      }

      const { employeeId, month } = validation.data;

      // Get Salary Structure for employee
      const structure = await prisma.salaryStructure.findUnique({
        where: { employeeId },
      });

      if (!structure) {
        throw new BadRequestError('Salary structure must be configured before generating slip');
      }

      const netSalary = structure.basicSalary + structure.allowances - structure.deductions;

      const slip = await prisma.salarySlip.upsert({
        where: {
          employeeId_month: {
            employeeId,
            month,
          },
        },
        update: {
          basicSalary: structure.basicSalary,
          allowances: structure.allowances,
          deductions: structure.deductions,
          netSalary,
          department: structure.department,
          designation: structure.designation,
        },
        create: {
          employeeId,
          month,
          basicSalary: structure.basicSalary,
          allowances: structure.allowances,
          deductions: structure.deductions,
          netSalary,
          department: structure.department,
          designation: structure.designation,
          status: 'PAID',
        },
      });

      res.status(201).json(slip);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payroll/slip/:id
 * Retrieve a specific salary slip details (Employee views own; HR views any)
 */
router.get(
  '/slip/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const slip = await prisma.salarySlip.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!slip) {
        throw new NotFoundError('Salary slip not found');
      }

      if (req.user!.role !== 'HR' && slip.employeeId !== req.user!.employeeId) {
        throw new ForbiddenError('Access denied: Unauthorized role');
      }

      res.json(slip);
    } catch (error) {
      next(error);
    }
  }
);

export { router as payrollRouter };
