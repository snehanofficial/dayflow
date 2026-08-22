import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/auth/index.js';
import { EmployeeController } from './controller.js';

const router = Router();
const controller = new EmployeeController();

// Employee profile endpoints
router.get('/employee/profile', requireAuth, controller.getProfile);
router.patch('/employee/profile', requireAuth, controller.updateProfile);

// HR endpoints
router.get(
  '/employees',
  requireAuth,
  requireRole('HR'),
  controller.listEmployees,
);
router.get('/employees/:id', requireAuth, controller.getEmployeeById);

export { router as employeeRouter };
export { EmployeeService } from './service.js';
export { EmployeeRepository } from './repository.js';
