import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AppShell } from './components/AppShell.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { ProtectedRoute } from './components/Auth/ProtectedRoute.js';
import { ToastContainer } from './components/Toast/ToastContainer.js';
import { toast } from './components/Toast/toastStore.js';
import {
  Button,
  Card,
  Badge,
  ConfirmDialog,
  LoadingState,
  ErrorState,
} from './components/ui/index.js';
import { apiClient } from './api/client.js';
import { config } from './config.js';

// Auth Pages
import { Login } from './pages/Auth/Login.js';
import { Signup } from './pages/Auth/Signup.js';
import { ForgotPassword } from './pages/Auth/ForgotPassword.js';
import { ResetPassword } from './pages/Auth/ResetPassword.js';
import { Playground } from './pages/Playground.js';

/**
 * Dashboard - verified session info, permissions, and component primitives.
 */
function DashboardHome() {
  const { user } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDestructiveOpen, setIsDestructiveOpen] = useState(false);

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const labels = {
      success: 'Operation completed.',
      error: 'Something went wrong.',
      warning: 'Proceed with caution.',
      info: 'For your information.',
    };
    toast[type](labels[type]);
  };

  return (
    <section>
      {/* Page header */}
      <div className="page-header">
        <h1 className="main-title">Dashboard</h1>
        <p className="subtitle">Authenticated session and foundation status.</p>
      </div>

      {/* Session info — two side-by-side cards */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Authenticated user */}
        <Card>
          <h2 className="card-title">Session</h2>
          <div className="kv-row">
            <span className="kv-label">Email</span>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              {user?.email}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-label">User ID</span>
            <span className="kv-value">{user?.id}</span>
          </div>
        </Card>

        {/* Permissions */}
        <Card>
          <h2 className="card-title">Permissions</h2>
          {user?.permissions && user.permissions.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-1)',
                marginTop: 'var(--space-1)',
              }}
            >
              {user.permissions.map((perm) => (
                <Badge key={perm} variant="info">
                  {perm}
                </Badge>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
              }}
            >
              No permissions assigned.
            </p>
          )}
        </Card>
      </div>

      {/* Foundation components */}
      <div className="divider" />
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h2 className="card-title">Foundation Components</h2>
        <p className="subtitle" style={{ marginBottom: 'var(--space-4)' }}>
          Verify toast, dialog, and feedback primitives.
        </p>
      </div>

      <div
        className="adaptive-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {/* Toast feedback */}
        <Card>
          <h3 className="card-title">Toast Feedback</h3>
          <div className="action-row">
            <Button
              onClick={() => triggerToast('success')}
              variant="secondary"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Success
            </Button>
            <Button
              onClick={() => triggerToast('error')}
              variant="secondary"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Error
            </Button>
            <Button
              onClick={() => triggerToast('warning')}
              variant="secondary"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Warning
            </Button>
            <Button
              onClick={() => triggerToast('info')}
              variant="secondary"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Info
            </Button>
          </div>
        </Card>

        {/* Dialog demos */}
        <Card>
          <h3 className="card-title">Dialogs</h3>
          <div className="action-row">
            <Button
              onClick={() => setIsConfirmOpen(true)}
              variant="secondary"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Standard
            </Button>
            <Button
              onClick={() => setIsDestructiveOpen(true)}
              variant="danger"
              style={{ fontSize: '0.75rem', height: 32 }}
            >
              Destructive
            </Button>
          </div>
        </Card>
      </div>

      {/* Standard dismissible confirm dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Action"
        message="Are you sure you want to proceed? You can click outside or press Esc to cancel."
        onConfirm={() => toast.success('Action confirmed.')}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Dangerous destructive confirm dialog */}
      <ConfirmDialog
        isOpen={isDestructiveOpen}
        title="Delete Resources Permanently?"
        message="This action cannot be undone. Click-outside dismissal is disabled to prevent accidental confirmation."
        confirmLabel="Delete Permanently"
        isDanger
        onConfirm={() => toast.success('Resource deleted.')}
        onCancel={() => setIsDestructiveOpen(false)}
      />
    </section>
  );
}

/**
 * Diagnostics — backend connection status, API errors, and table primitives.
 */
function DiagnosticsPage() {
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      setErrorText(null);
      const data = await apiClient<{ status: string; timestamp: string }>(
        '/api/health',
      );
      setHealthStatus(data.status);
      setTimestamp(data.timestamp);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'API request failed.';
      setHealthStatus('error');
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const triggerApiError = async () => {
    try {
      await apiClient('/api/unmapped-route-xyz', { method: 'POST' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'API error.';
      toast.error(`API Error: ${message}`);
    }
  };

  const sampleData = [
    { service: 'PostgreSQL DB', status: 'Connected', code: 'OK' },
    { service: 'Cookie Session', status: 'Active', code: 'SECURE' },
    { service: 'CSRF Protection', status: 'Enforced', code: 'ACTIVE' },
    { service: 'PWA Worker', status: 'Registered', code: 'OFFLINE' },
  ];

  return (
    <section>
      <div className="page-header">
        <h1 className="main-title">Diagnostics</h1>
        <p className="subtitle">
          Backend connection, security status, and API error handling.
        </p>
      </div>

      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* API health */}
        <Card>
          <h2 className="card-title">API Health</h2>
          {isLoading ? (
            <LoadingState message="Connecting..." />
          ) : errorText ? (
            <ErrorState message={errorText} onRetry={fetchHealth} />
          ) : (
            <>
              <div className="kv-row">
                <span className="kv-label">Status</span>
                <Badge variant={healthStatus === 'ok' ? 'success' : 'error'}>
                  {healthStatus}
                </Badge>
              </div>
              {timestamp && (
                <div className="kv-row">
                  <span className="kv-label">Server time</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {new Date(timestamp).toLocaleString()}
                  </span>
                </div>
              )}
              <div style={{ marginTop: 'var(--space-3)' }}>
                <Button
                  onClick={fetchHealth}
                  variant="secondary"
                  style={{ height: 32, fontSize: '0.75rem' }}
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Error handling */}
        <Card>
          <h2 className="card-title">Error Handling</h2>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Verify normalized API error responses.
          </p>
          <Button
            onClick={triggerApiError}
            variant="danger"
            style={{ height: 32, fontSize: '0.75rem' }}
          >
            Trigger 404
          </Button>
        </Card>
      </div>

      {/* Service status table */}
      <Card>
        <h2 className="card-title">Service Status</h2>
        <div
          className="responsive-table-wrapper"
          style={{ marginTop: 'var(--space-2)' }}
        >
          <table className="adaptive-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, idx) => (
                <tr key={idx}>
                  <td data-label="Service">{row.service}</td>
                  <td data-label="Status">{row.status}</td>
                  <td data-label="Code">
                    <Badge variant="info">{row.code}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

/**
 * 404 page
 */
function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <p
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        404
      </p>
      <div>
        <h1
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 'var(--space-1)',
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          The requested page does not exist or has been relocated.
        </p>
      </div>
      <Button variant="primary" onClick={() => (window.location.href = '/')}>
        Return to Dashboard
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Unprotected Auth Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected App Shell Pages */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route
                  path="diagnostics"
                  element={
                    <ProtectedRoute
                      permission={{ resource: 'resources', action: 'read' }}
                    >
                      <DiagnosticsPage />
                    </ProtectedRoute>
                  }
                />
                {config.isDev && (
                  <Route path="playground" element={<Playground />} />
                )}
              </Route>

              {/* Catch-all Fallbacks */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export { App };
