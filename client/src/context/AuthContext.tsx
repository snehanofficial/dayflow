import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, clearCsrfToken } from '../api/client.js';

interface User {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  emailVerified: boolean;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    employeeId: string,
    email: string,
    password: string,
    role: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stable query keys
const CSRF_QUERY_KEY = ['auth', 'csrf'] as const;
const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  /**
   * Bootstrap a CSRF token.
   * Must succeed (or fail gracefully) before the session query runs so that
   * subsequent POST requests (including /login) have a token ready.
   */
  const csrfQuery = useQuery({
    queryKey: CSRF_QUERY_KEY,
    queryFn: () =>
      apiClient<{ csrfToken: string }>('/api/auth/csrf').catch(() => null),
    staleTime: 23 * 60 * 60 * 1000, // 23 h (token expires server-side at 24 h)
    refetchOnWindowFocus: false,
    retry: false,
  });

  /**
   * Fetch the current session.
   * Enabled only after the CSRF query has settled (success or failure),
   * so the CSRF token is ready before any protected route renders.
   * A 401 is the expected unauthenticated response — not an error.
   */
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await apiClient<{ user: User; csrfToken: string }>(
          '/api/auth/me',
        );
        return res.user;
      } catch {
        // 401 Unauthorized is expected for unauthenticated sessions.
        return null;
      }
    },
    enabled: !csrfQuery.isLoading, // wait for CSRF bootstrap to settle
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: true,
    retry: false,
  });

  const user = sessionQuery.data ?? null;
  const isLoading = csrfQuery.isLoading || sessionQuery.isLoading;

  /**
   * Login: call the API then write the user directly into the query cache
   * so all subscribers see the update without an additional network round-trip.
   */
  const login = async (email: string, password: string) => {
    const res = await apiClient<{ user: User; csrfToken: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        data: { email, password },
      },
    );
    queryClient.setQueryData(SESSION_QUERY_KEY, res.user);
  };

  const signup = async (
    employeeId: string,
    email: string,
    password: string,
    role: string,
  ) => {
    await apiClient<{ success: boolean; message: string }>('/api/auth/signup', {
      method: 'POST',
      data: { employeeId, email, password, role },
    });
  };

  const verifyEmail = async (token: string) => {
    await apiClient('/api/auth/verify-email', {
      method: 'POST',
      data: { token },
    });
  };

  const resendVerification = async (email: string) => {
    await apiClient('/api/auth/resend-verification', {
      method: 'POST',
      data: { email },
    });
  };

  /**
   * Logout:
   * 1. Invalidate the server session (also clears sid + csrf-token cookies).
   * 2. Clear the in-memory CSRF token immediately.
   * 3. Wipe session cache so protected routes see null synchronously.
   * 4. Await a fresh CSRF bootstrap so the login form POST has a valid token
   *    without requiring a manual refresh.
   */
  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } finally {
      clearCsrfToken();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);

      try {
        // fetchQuery forces an immediate await on the refetch
        await queryClient.fetchQuery({
          queryKey: CSRF_QUERY_KEY,
          queryFn: () => apiClient<{ csrfToken: string }>('/api/auth/csrf'),
          staleTime: 0,
        });
      } catch {
        // Non-fatal: login form will surface the CSRF error on submit if needed
      }
    }
  };

  /**
   * Manually re-validate the session (e.g., after a silent token refresh).
   * Exposed for consumers that need to trigger a recheck without a full logout.
   */
  const checkAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  };

  const hasPermission = (resource: string, action: string) => {
    if (!user) return false;
    const target = `${resource}.${action}`;
    return user.permissions.includes(target) || user.permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        hasPermission,
        checkAuth,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
