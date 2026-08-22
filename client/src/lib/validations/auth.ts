import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'New password is required.')
      .min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const signupSchema = z
  .object({
    employeeId: z
      .string()
      .min(1, 'Employee ID is required.')
      .regex(/^EMP-\w+$/i, 'Employee ID must start with EMP- (e.g. EMP-101)'),
    email: z
      .string()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.'),
    password: z
      .string()
      .min(1, 'Password is required.')
      .min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    role: z.enum(['Employee', 'HR'], {
      errorMap: () => ({ message: 'Please select a valid role.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
