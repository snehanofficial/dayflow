import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute.js';
import * as authContext from '../../context/AuthContext.js';

vi.mock('../../context/AuthContext.js', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state when authentication session is checking', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      hasPermission: () => false,
      checkAuth: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Verifying session...')).toBeTruthy();
  });

  it('should render children if user is authenticated', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: '123',
        employeeId: 'EMP-123',
        email: 'test@example.com',
        role: 'HR',
        emailVerified: true,
        permissions: [],
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      hasPermission: () => true,
      checkAuth: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });
});
