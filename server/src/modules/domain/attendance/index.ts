import { Router } from 'express';
import { requireAuth } from '../../core/auth/index.js';
import { AttendanceController } from './controller.js';

const router = Router();
const controller = new AttendanceController();

router.post('/attendance/check-in', requireAuth, controller.checkIn);
router.post('/attendance/check-out', requireAuth, controller.checkOut);
router.get('/attendance/today', requireAuth, controller.getToday);
router.get('/attendance/history', requireAuth, controller.getHistory);
router.get('/attendance/insights', requireAuth, controller.getInsights);

export { router as attendanceRouter };
export { AttendanceService } from './service.js';
export { AttendanceRepository } from './repository.js';
