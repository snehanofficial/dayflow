import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/index.js';
import { requireAuth } from '../core/auth/middleware.js';
import { z } from 'zod';

const router = Router();

// Secure all notification endpoints to authenticated users
router.use(requireAuth);

/**
 * GET /api/notifications
 * Retrieve notifications feed for active user.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/mark-read
 * Mark selected notifications or all notifications as read.
 */
router.post(
  '/mark-read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const schema = z.object({
        ids: z.array(z.string().uuid()).optional(),
      });

      const parsed = schema.safeParse(req.body);
      const ids = parsed.success ? parsed.data.ids : undefined;

      if (ids && ids.length > 0) {
        await prisma.notification.updateMany({
          where: {
            userId,
            id: { in: ids },
          },
          data: { read: true },
        });
      } else {
        await prisma.notification.updateMany({
          where: {
            userId,
            read: false,
          },
          data: { read: true },
        });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
