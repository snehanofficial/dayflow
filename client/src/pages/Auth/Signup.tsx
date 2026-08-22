import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button, Label, Input, Select } from '../../components/ui/index.js';
import {
  signupSchema,
  type SignupFormData,
} from '../../lib/validations/auth.js';

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      employeeId: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Employee',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data.employeeId, data.email, data.password, data.role);
      navigate('/verify-email', {
        state: { email: data.email },
        replace: true,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError('root', { message });
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-description">
            Get started with your employee dashboard.
          </p>
        </div>

        {errors.root && (
          <div className="form-error-summary" role="alert">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <Label htmlFor="employeeId" required>
              Employee ID
            </Label>
            <Input
              id="employeeId"
              type="text"
              placeholder="EMP-101"
              error={errors.employeeId?.message}
              aria-invalid={!!errors.employeeId}
              aria-describedby={
                errors.employeeId ? 'employeeId-error' : undefined
              }
              {...register('employeeId')}
            />
            {errors.employeeId && (
              <span
                id="employeeId-error"
                className="form-error-msg"
                role="alert"
              >
                {errors.employeeId.message}
              </span>
            )}
          </div>

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

          <div className="form-group">
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="input-wrapper">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                style={{ paddingRight: 'var(--space-8)' }}
                {...register('password')}
              />
              <button
                type="button"
                className="input-suffix-btn"
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
            </div>
            {errors.password && (
              <span id="password-error" className="form-error-msg" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <Label htmlFor="confirmPassword" required>
              Confirm Password
            </Label>
            <div className="input-wrapper">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                style={{ paddingRight: 'var(--space-8)' }}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="input-suffix-btn"
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
            </div>
            {errors.confirmPassword && (
              <span
                id="confirmPassword-error"
                className="form-error-msg"
                role="alert"
              >
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <div
            className="form-group"
            style={{ marginBottom: 'var(--space-5)' }}
          >
            <Label htmlFor="role" required>
              Role
            </Label>
            <Select
              id="role"
              error={errors.role?.message}
              aria-invalid={!!errors.role}
              aria-describedby={errors.role ? 'role-error' : undefined}
              options={[
                { label: 'Employee', value: 'Employee' },
                { label: 'HR', value: 'HR' },
              ]}
              {...register('role')}
            />
            {errors.role && (
              <span id="role-error" className="form-error-msg" role="alert">
                {errors.role.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%' }}
            isLoading={isSubmitting}
          >
            Sign up
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
