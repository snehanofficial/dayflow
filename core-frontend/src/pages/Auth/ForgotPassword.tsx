import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Code2 } from 'lucide-react';
import { Button, Label, Input } from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../../lib/validations/auth.js';

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiClient('/api/auth/forgot-password', {
        method: 'POST',
        data: { email: data.email },
      });
    } catch {
      setError('root', {
        message: 'Unable to request reset. Please try again.',
      });
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <Code2 size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>HackCore</span>
          </Link>
          <h1 className="auth-title">Reset password</h1>
          {!isSubmitSuccessful && (
            <p className="auth-description">
              Enter your email and we'll send a reset link.
            </p>
          )}
        </div>

        {errors.root && (
          <div className="form-error-summary" role="alert">
            {errors.root.message}
          </div>
        )}

        {!isSubmitSuccessful ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <span id="email-error" className="form-error-msg" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              style={{ width: '100%' }}
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="auth-success">
            <p className="auth-description">
              If an account is associated with{' '}
              <strong>{getValues('email')}</strong>, a reset link has been sent
              to that address.
            </p>
            <p className="auth-note">
              In development, the reset link is printed to the backend console.
            </p>
          </div>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
export default ForgotPassword;
