import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EmployeeService } from './service.js';
import { BadRequestError, ForbiddenError } from '../../core/errors/index.js';

const employeeUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).nullable().optional(),
});

const employeeHrUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  phone: z.string().max(30).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  designation: z.string().max(100).nullable().optional(),
  joiningDate: z
    .preprocess(
      (val) => (val ? new Date(val as string) : null),
      z.date().nullable(),
    )
    .optional(),
  profileImage: z.string().max(500).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  employmentStatus: z.string().max(50).nullable().optional(),
});

export class EmployeeController {
  private service = new EmployeeService();

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }
      const profile = await this.service.getOrCreateProfile(
        req.user.id,
        req.user.employeeId,
      );
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BadRequestError('User context missing');
      }
      const parsedBody = employeeUpdateSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError(
          parsedBody.error.errors.map((e: z.ZodIssue) => e.message).join(', '),
        );
      }
      const updatedProfile = await this.service.updateProfile(
        req.user.id,
        req.user.employeeId,
        parsedBody.data,
      );
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  };

  listEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await this.service.getAllProfiles();
      res.json({ employees });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new BadRequestError('Employee ID parameter must be a string');
      }
      const profile = await this.service.getProfileById(id);

      // Ownership check: must be HR or requesting own profile
      if (req.user?.role !== 'HR' && profile.userId !== req.user?.id) {
        throw new ForbiddenError(
          'Access denied: Unauthorized to view this profile',
        );
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateEmployeeById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new BadRequestError('Employee ID parameter must be a string');
      }

      const parsedBody = employeeHrUpdateSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new BadRequestError(
          parsedBody.error.errors.map((e: z.ZodIssue) => e.message).join(', '),
        );
      }

      const updatedProfile = await this.service.updateEmployeeProfile(
        id,
        parsedBody.data,
      );
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  };
}
