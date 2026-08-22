import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../database/index.js';
import { logger } from '../logger/index.js';
import { config } from '../config/index.js';
import {
  BadRequestError,
  UnauthorizedError,
  AuthInvalidCredentialsError,
  AuthEmailExistsError,
  AuthEmailNotVerifiedError,
  AuthInvalidVerificationError,
} from '../errors/index.js';
import { verifyPassword, hashPassword } from './hash.js';
import { generateCsrfToken } from './csrf.js';
import { authenticateSession } from './middleware.js';

const router = Router();

/**
 * Helper to fetch and format user permissions.
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  const permissions = await prisma.userPermission.findMany({
    where: { userId },
  });
  return permissions.map((p) => `${p.resource}.${p.action}`);
}

/**
 * GET /api/auth/csrf
 */
router.get('/csrf', (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken();
  const isProd = config.NODE_ENV === 'production';

  res.cookie('csrf-token', csrfToken, {
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  res.json({ csrfToken });
});

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthInvalidCredentialsError();
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new AuthInvalidCredentialsError();
      }

      if (!user.emailVerified) {
        throw new AuthEmailNotVerifiedError();
      }

      // Generate Session and CSRF tokens
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const csrfToken = generateCsrfToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt,
        },
      });

      const isProd = config.NODE_ENV === 'production';

      // Set HTTP-Only Session Cookie
      res.cookie('sid', sessionToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      });

      // Set Non-HTTP-Only CSRF Cookie (Double Submit)
      res.cookie('csrf-token', csrfToken, {
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      });

      const permissions = await getUserPermissions(user.id);

      res.json({
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          permissions,
        },
        csrfToken,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/signup
 */
router.post(
  '/signup',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, email, password, role } = req.body;

      if (!employeeId || !email || !password || !role) {
        throw new BadRequestError(
          'Employee ID, email, password, and role are required',
        );
      }

      const upperRole = role.toUpperCase();
      if (upperRole !== 'EMPLOYEE' && upperRole !== 'HR') {
        throw new BadRequestError(
          'Invalid role. Supported roles are Employee and HR.',
        );
      }

      if (typeof email !== 'string' || !email.includes('@')) {
        throw new BadRequestError('Invalid email address');
      }
      if (typeof password !== 'string' || password.length < 8) {
        throw new BadRequestError(
          'Password must be at least 8 characters long',
        );
      }

      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        throw new AuthEmailExistsError();
      }

      const existingUserByEmployeeId = await prisma.user.findUnique({
        where: { employeeId },
      });
      if (existingUserByEmployeeId) {
        throw new BadRequestError('Employee ID is already registered');
      }

      const hashedPassword = await hashPassword(password);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ); // 24 hours

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            employeeId,
            email,
            passwordHash: hashedPassword,
            role: upperRole,
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
          },
        });

        // Set default role-based permissions
        const defaultPermissions =
          upperRole === 'HR'
            ? [
              { resource: 'dashboard', action: 'read' },
              { resource: 'profile', action: 'read' },
              { resource: 'profile', action: 'update' },
              { resource: 'resources', action: 'read' },
              { resource: 'resources', action: 'create' },
              { resource: 'resources', action: 'delete' },
              { resource: 'leave', action: 'read' },
              { resource: 'leave', action: 'manage' },
              { resource: 'payroll', action: 'read' },
              { resource: 'payroll', action: 'manage' },
              { resource: 'analytics', action: 'read' },
            ]
            : [
              { resource: 'dashboard', action: 'read' },
              { resource: 'profile', action: 'read' },
              { resource: 'profile', action: 'update' },
              { resource: 'resources', action: 'read' },
              { resource: 'leave', action: 'read' },
              { resource: 'leave', action: 'create' },
              { resource: 'payroll', action: 'read' },
            ];

        await Promise.all(
          defaultPermissions.map((perm) =>
            tx.userPermission.create({
              data: {
                userId: newUser.id,
                resource: perm.resource,
                action: perm.action,
              },
            }),
          ),
        );

        return newUser;
      });

      // Log link in dev environments so developers can verify without SMTP services
      logger.info(
        `[EMAIL VERIFICATION LINK]: http://localhost:5173/verify-email?token=${verificationToken}`,
      );

      res.status(201).json({
        success: true,
        message:
          'Account created. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticateSession,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.session) {
        await prisma.session.delete({
          where: { token: req.session.token },
        });
      }

      res.clearCookie('sid', { path: '/' });
      res.clearCookie('csrf-token', { path: '/' });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticateSession,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const permissions = await getUserPermissions(user.id);

      // Provide a fresh CSRF token if request was validated successfully
      const csrfToken = generateCsrfToken();
      res.cookie('csrf-token', csrfToken, {
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      res.json({
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          permissions,
        },
        csrfToken,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/verify-email
 */
router.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new BadRequestError('Token is required');
      }

      const user = await prisma.user.findUnique({
        where: { verificationToken: token },
      });

      if (
        !user ||
        !user.verificationTokenExpiry ||
        user.verificationTokenExpiry < new Date()
      ) {
        throw new AuthInvalidVerificationError();
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      res.json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/resend-verification
 */
router.post(
  '/resend-verification',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestError('Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Safe generic response to avoid account enumeration
        return res.json({
          success: true,
          message: 'If the email exists, a verification link has been sent.',
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          message: 'Email is already verified.',
        });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpiry: expiry,
        },
      });

      logger.info(
        `[EMAIL VERIFICATION LINK]: http://localhost:5173/verify-email?token=${verificationToken}`,
      );

      res.json({
        success: true,
        message: 'If the email exists, a verification link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/forgot-password
 */
router.post(
  '/forgot-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestError('Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // To prevent account enumeration, always return positive response
      const genericResponse = {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };

      if (!user) {
        return res.json(genericResponse);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: expiry,
        },
      });

      // Log the token link in local dev for testing, avoiding SMTP dependencies in Core
      logger.info(
        `[PASSWORD RESET LINK]: http://localhost:5173/reset-password?token=${resetToken}`,
      );

      res.json(genericResponse);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/reset-password
 */
router.post(
  '/reset-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new BadRequestError('Token and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { passwordResetToken: token },
      });

      if (
        !user ||
        !user.passwordResetExpiry ||
        user.passwordResetExpiry < new Date()
      ) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      const hashedPassword = await hashPassword(password);

      await prisma.$transaction(async (tx) => {
        // Update password hash and revoke reset tokens
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null,
          },
        });

        // Revoke all existing sessions for this user across all devices
        await tx.session.deleteMany({
          where: { userId: user.id },
        });
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export { router as authRouter };
