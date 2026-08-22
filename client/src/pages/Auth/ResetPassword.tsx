import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Code2, Eye, EyeOff } from 'lucide-react';
import { Button, Label, Input } from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { toast } from '../../components/Toast/toastStore.js';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '../../lib/validations/auth.js';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('root', {
        message: 'Reset token is missing from the link URL.',
      });
      return;
    }

    try {
      await apiClient('/api/auth/reset-password', {
        method: 'POST',
        data: { token, password: data.password },
      });
      toast.success('Password updated successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. The link may have expired.';
      setError('root', { message });
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <Code2 size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>DayFlow</span>
          </Link>
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-description">
            Create a secure password for your account
          </p>
        </div>

        {errors.root && (
          <div className="form-error-summary" role="alert">
            {errors.root.message}
          </div>
        )}

        {token ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <Label htmlFor="password" required>
                New Password
              </Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                {...register('password')}
                endIcon={
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                }
              />
              {errors.password && (
                <span
                  id="password-error"
                  className="form-error-msg"
                  role="alert"
                >
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <Label htmlFor="confirmPassword" required>
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-password-error' : undefined
                }
                {...register('confirmPassword')}
                endIcon={
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    tabIndex={0}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                }
              />
              {errors.confirmPassword && (
                <span
                  id="confirm-password-error"
                  className="form-error-msg"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              style={{ width: '100%' }}
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </form>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-danger)',
                lineHeight: 1.5,
              }}
            >
              Invalid reset link. No token parameter was detected in the URL
              query parameters.
            </p>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
export default ResetPassword;
