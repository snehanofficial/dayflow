import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.js';
import { LoadingState } from '../ui/index.js';
import { ErrorState } from '../ui/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: { resource: string; action: string };
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying session..." />;
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
