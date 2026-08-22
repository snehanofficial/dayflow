import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { Login } from './Login.js';
import * as authContext from '../../context/AuthContext.js';

vi.mock('../../context/AuthContext.js', () => ({
  useAuth: vi.fn(),
}));

describe('Login Page Auto-Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not redirect if user is not authenticated', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      hasPermission: () => false,
      checkAuth: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Should render the Login form and show "Sign in" title
    expect(screen.getAllByText('Sign in')).toBeTruthy();
    expect(screen.queryByText('Home Page')).toBeNull();
  });

  it('should redirect to home page if user is already authenticated', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: '123',
        employeeId: 'EMP-123',
        email: 'test@example.com',
        role: 'EMPLOYEE',
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
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Should be redirected to home page
    expect(screen.getByText('Home Page')).toBeTruthy();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('should redirect to redirect URI if user is already authenticated and query parameter is present', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: '123',
        employeeId: 'EMP-123',
        email: 'test@example.com',
        role: 'EMPLOYEE',
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
      <MemoryRouter initialEntries={['/login?redirectTo=%2Fdiagnostics']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/diagnostics" element={<div>Diagnostics Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Should be redirected to the diagnostics page
    expect(screen.getByText('Diagnostics Page')).toBeTruthy();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('should redirect to home page and avoid loop if redirect URI is /login itself', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: {
        id: '123',
        employeeId: 'EMP-123',
        email: 'test@example.com',
        role: 'EMPLOYEE',
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
      <MemoryRouter initialEntries={['/login?redirectTo=%2Flogin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Should be redirected to the home page (preventing loop)
    expect(screen.getByText('Home Page')).toBeTruthy();
  });
});
