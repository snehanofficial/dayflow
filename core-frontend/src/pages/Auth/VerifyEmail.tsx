import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router';
import { Mail, CheckCircle2, XCircle, Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button, Input, Label } from '../../components/ui/index.js';
import { toast } from '../../components/Toast/toastStore.js';

export function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      const performVerification = async () => {
        try {
          setStatus('verifying');
          await verifyEmail(token);
          setStatus('success');
          toast.success('Email verified successfully.');
        } catch (err: unknown) {
          setStatus('error');
          const msg = err instanceof Error ? err.message : 'Verification failed.';
          setErrorMessage(msg);
          toast.error(msg);
        }
      };
      performVerification();
    } else {
      setStatus('pending');
    }
  }, [token, verifyEmail]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    try {
      setResending(true);
      await resendVerification(email);
      toast.success('Verification email sent successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification email.';
      toast.error(msg);
    } finally {
      setResending(false);
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
        </div>

        {status === 'verifying' && (
          <div className="text-center" style={{ padding: 'var(--space-6) 0' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4) auto' }} />
            <h1 className="auth-title">Verifying email</h1>
            <p className="auth-description">
              Please wait while we confirm your email address...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center" style={{ padding: 'var(--space-6) 0' }}>
            <CheckCircle2
              size={48}
              className="text-success"
              style={{ margin: '0 auto var(--space-4) auto', color: 'var(--color-success-text)' }}
            />
            <h1 className="auth-title">Email verified</h1>
            <p className="auth-description" style={{ marginBottom: 'var(--space-6)' }}>
              Your email address has been verified successfully. You can now log in to your account.
            </p>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/login')}
            >
              Continue to Sign In
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center" style={{ padding: 'var(--space-4) 0' }}>
            <XCircle
              size={48}
              className="text-danger"
              style={{ margin: '0 auto var(--space-4) auto', color: 'var(--color-error-text)' }}
            />
            <h1 className="auth-title">Verification failed</h1>
            <p className="auth-description" style={{ marginBottom: 'var(--space-6)' }}>
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>

            <div className="divider" style={{ margin: 'var(--space-6) 0' }} />

            <h2 className="card-title" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
              Need a new link?
            </h2>
            <form onSubmit={handleResend} noValidate>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <Label htmlFor="email" required>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resending}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
                isLoading={resending}
              >
                Resend verification email
              </Button>
            </form>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center" style={{ padding: 'var(--space-4) 0' }}>
            <Mail
              size={48}
              style={{ margin: '0 auto var(--space-4) auto', color: 'var(--color-text-muted)' }}
            />
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-description" style={{ marginBottom: 'var(--space-6)' }}>
              We've sent a verification link to your registered email address{email ? ` (${email})` : ''}.
              Please check your inbox and click the link to verify your account.
            </p>

            <div className="divider" style={{ margin: 'var(--space-6) 0' }} />

            <h2 className="card-title" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
              Didn't receive the email?
            </h2>
            <form onSubmit={handleResend} noValidate>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <Label htmlFor="email" required>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resending}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
                isLoading={resending}
              >
                Resend verification email
              </Button>
            </form>
          </div>
        )}

        <p className="auth-footer" style={{ marginTop: 'var(--space-6)' }}>
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
