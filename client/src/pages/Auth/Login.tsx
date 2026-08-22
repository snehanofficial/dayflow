import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button, Label, Input } from '../../components/ui/index.js';
import { loginSchema, type LoginFormData } from '../../lib/validations/auth.js';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectTo =
    searchParams.get('redirectTo') ||
    searchParams.get('redirect') ||
    searchParams.get('returnTo');
  const from = redirectTo || location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const currentEmail = watch('email');

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'AUTH_EMAIL_NOT_VERIFIED'
      ) {
        setError('root', { message: 'AUTH_EMAIL_NOT_VERIFIED' });
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Login failed. Check your credentials.';
        setError('root', { message });
      }
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <Code2 size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Dayflow</span>
          </Link>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-description">Access your employee dashboard.</p>
        </div>

        {errors.root && (
          <div className="form-error-summary" role="alert">
            {errors.root.message === 'AUTH_EMAIL_NOT_VERIFIED' ? (
              <span>
                Please verify your email before signing in.{' '}
                <Link
                  to="/verify-email"
                  state={{ email: currentEmail }}
                  style={{
                    color: 'var(--color-primary-text)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Verify email now
                </Link>
              </span>
            ) : (
              errors.root.message
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
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

          <div
            className="form-group"
            style={{ marginBottom: 'var(--space-5)' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-1)',
              }}
            >
              <Label htmlFor="password" required>
                Password
              </Label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <span id="password-error" className="form-error-msg" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%' }}
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
