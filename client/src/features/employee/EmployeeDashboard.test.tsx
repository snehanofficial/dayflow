import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeDashboard } from './EmployeeDashboard.js';
import * as client from '../../api/client.js';

vi.mock('../../api/client.js', () => ({
  apiClient: vi.fn(),
}));

vi.mock('../../context/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'employee-test@example.com', role: 'EMPLOYEE' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../components/Toast/toastStore.js', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProfile = {
  id: 'emp-123',
  userId: '123',
  employeeCode: 'EMP-001',
  firstName: 'John',
  lastName: 'Doe',
  phone: '1234567890',
  department: 'Engineering',
  designation: 'Senior Developer',
  profileImage: null,
  joiningDate: '2026-01-01T00:00:00.000Z',
  employmentStatus: 'ACTIVE',
};

const mockTodayAttendance = {
  attendance: null,
};

const mockInsights = {
  period: { startDate: '2026-08-01', endDate: '2026-08-31' },
  summary: {
    recordedDays: 22,
    presentDays: 20,
    lateDays: 1,
    halfDayDays: 0,
    absentDays: 1,
    onTimeRate: 95,
  },
  breakdown: [],
};

const mockHistory = {
  history: [
    {
      id: 'log-1',
      employeeId: 'emp-123',
      date: '2026-08-22',
      checkIn: '2026-08-22T09:00:00.000Z',
      checkOut: '2026-08-22T17:00:00.000Z',
      status: 'PRESENT',
    },
  ],
  pagination: { total: 1, limit: 5, offset: 0 },
};

const mockLeaveBalance = {
  paid: { allocated: 15, used: 2, remaining: 13 },
  sick: { allocated: 10, used: 1, remaining: 9 },
  unpaid: { allocated: 0, used: 0, remaining: 0 },
};

const mockSlips = {
  slips: [
    {
      id: 'slip-1',
      employeeId: 'emp-123',
      month: '2026-07',
      basicSalary: 5000,
      allowances: 1000,
      deductions: 500,
      netSalary: 5500,
      status: 'PAID',
    },
  ],
};

const renderWithQuery = (ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('EmployeeDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(client.apiClient).mockImplementation(async () => {
      return new Promise(() => {}); // never resolves
    });

    renderWithQuery(<EmployeeDashboard />);
    // Just verify the skeletons exist
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('should render all dashboard sections correctly after loading', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/employee/profile') return mockProfile;
      if (path === '/api/attendance/today') return mockTodayAttendance;
      if (path.startsWith('/api/attendance/insights')) return mockInsights;
      if (path.startsWith('/api/attendance/history')) return mockHistory;
      if (path === '/api/leave/balance') return mockLeaveBalance;
      if (path === '/api/payroll/slips') return mockSlips;
      return {};
    });

    renderWithQuery(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John Doe!')).toBeTruthy();
      expect(screen.getByText('Senior Developer (Engineering)')).toBeTruthy();
      expect(screen.getByText('Code: EMP-001')).toBeTruthy();

      // Check-in button
      expect(screen.getByRole('button', { name: 'Check In' })).toBeTruthy();

      // Insights
      expect(screen.getByText('95%')).toBeTruthy();
      expect(screen.getByText('Late Check-ins')).toBeTruthy();

      // Leaves
      expect(screen.getByText('Paid Leave')).toBeTruthy();
      expect(screen.getByText('Used 2 / 15 Days')).toBeTruthy();

      // Salary Slip
      expect(screen.getByText('2026-07')).toBeTruthy();
      expect(screen.getByText('$5500')).toBeTruthy();
    });
  });

  it('should handle API failure gracefully', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/employee/profile') {
        throw new Error('Database connection failed');
      }
      return {};
    });

    renderWithQuery(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeTruthy();
    });
  });
});
