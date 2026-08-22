import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.js';
import { Skeleton } from '../ui/index.js';
import { ErrorState } from '../ui/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: { resource: string; action: string };
  role?: 'EMPLOYEE' | 'HR' | ('EMPLOYEE' | 'HR')[];
}

export function ProtectedRoute({
  children,
  permission,
  role,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="app-container app-layout"
        aria-busy="true"
        aria-live="polite"
      >
        <header
          className="top-bar app-header"
          style={{ pointerEvents: 'none' }}
        >
          <div className="brand-section">
            <span className="brand-name">DayFlow</span>
          </div>
          <div className="topbar-search-trigger" style={{ opacity: 0.5 }}>
            <Skeleton width="120px" height="20px" />
          </div>
          <div className="topbar-actions">
            <Skeleton
              width="28px"
              height="28px"
              borderRadius="50%"
              style={{ display: 'inline-block', marginRight: 'var(--space-2)' }}
            />
            <Skeleton
              width="60px"
              height="20px"
              style={{ display: 'inline-block' }}
            />
          </div>
        </header>
        <div className="shell-layout">
          <aside className="app-sidebar" style={{ pointerEvents: 'none' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
              }}
            >
              <Skeleton width="80%" height="24px" />
              <Skeleton width="70%" height="24px" />
              <Skeleton width="75%" height="24px" />
              <Skeleton width="60%" height="24px" />
              <Skeleton width="80%" height="24px" />
            </div>
          </aside>
          <main className="main-content" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <Skeleton
                width="200px"
                height="32px"
                style={{ marginBottom: 'var(--space-2)' }}
              />
              <Skeleton width="350px" height="16px" />
            </div>
            <div
              className="adaptive-grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <Skeleton height="180px" />
              <Skeleton height="180px" />
              <Skeleton height="180px" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but keep current location for redirect-back on success
    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!user || !roles.includes(user.role.toUpperCase() as any)) {
      return (
        <div style={{ padding: '2rem' }}>
          <ErrorState
            title="Access Denied"
            message={`You do not have permission to access this resource. Requires role: ${roles.join(', ')}.`}
          />
        </div>
      );
    }
  }

  if (permission && !hasPermission(permission.resource, permission.action)) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorState
          title="Access Denied"
          message={`You do not have permission to access this resource (${permission.resource}.${permission.action}).`}
        />
      </div>
    );
  }

  return <>{children}</>;
}
export default ProtectedRoute;
