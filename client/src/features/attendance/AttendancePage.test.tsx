import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AttendancePage } from './AttendancePage.js';
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

describe('AttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading states initially', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return new Promise(() => {}); // Never resolves to keep loading state active
      }
      return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
    });

    render(<AttendancePage />);

    expect(screen.getByText('Loading attendance status...')).toBeTruthy();
  });

  it("should render error state when API fails to load today's status", async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        throw new Error('API server down');
      }
      return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('API server down')).toBeTruthy();
    });
  });

  it('should render Check In button when user is not checked in today', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return { attendance: null };
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });
  });

  it('should render Check Out button when user is checked in but not checked out', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return {
          attendance: {
            id: 'att-123',
            date: '2026-08-22',
            checkIn: '2026-08-22T08:30:00.000Z',
            checkOut: null,
            status: 'PRESENT',
          },
        };
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-out for today' }),
      ).toBeTruthy();
    });
  });

  it('should render Completed state when user has checked out', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return {
          attendance: {
            id: 'att-123',
            date: '2026-08-22',
            checkIn: '2026-08-22T08:30:00.000Z',
            checkOut: '2026-08-22T17:00:00.000Z',
            status: 'PRESENT',
          },
        };
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Attendance Completed Today')).toBeTruthy();
    });
  });

  it('should render historical records in the log table', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return { attendance: null };
      }
      if (path === '/api/attendance/history') {
        return {
          history: [
            {
              id: 'att-past-1',
              date: '2026-08-21',
              checkIn: '2026-08-21T08:45:00.000Z',
              checkOut: '2026-08-21T17:30:00.000Z',
              status: 'PRESENT',
            },
            {
              id: 'att-past-2',
              date: '2026-08-20',
              checkIn: '2026-08-20T09:15:00.000Z',
              checkOut: '2026-08-20T17:00:00.000Z',
              status: 'LATE',
            },
          ],
          pagination: { total: 2, limit: 10, offset: 0 },
        };
      }
      return {};
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('LATE')).toBeTruthy();
      expect(screen.getByText('PRESENT')).toBeTruthy();
    });
  });
});
