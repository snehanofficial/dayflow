import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database/index.js';
import { UnauthorizedError } from '../errors/index.js';
import { authenticateSession } from '../auth/index.js';

const router = Router();

/**
 * GET /api/users/search
 * Search user profiles by email. Requires active authenticated session.
 */
router.get(
  '/users/search',
  authenticateSession,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const q = typeof req.query.q === 'string' ? req.query.q : '';

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: q,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          email: true,
        },
        take: 10,
        orderBy: {
          email: 'asc',
        },
      });

      res.json({ users });
    } catch (error) {
      next(error);
    }
  },
);

export { router as searchRouter };
