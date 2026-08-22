import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Default mocked insights response to avoid breakage in today status and history tests
const mockInsightsDefault = {
  period: { startDate: '2026-08-01', endDate: '2026-08-31' },
  summary: {
    recordedDays: 2,
    presentDays: 1,
    lateDays: 1,
    halfDayDays: 0,
    absentDays: 0,
    onTimeRate: 50,
  },
  breakdown: [
    { date: '2026-08-01', status: 'PRESENT' },
    { date: '2026-08-02', status: 'LATE' },
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

describe('AttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading states initially', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return new Promise(() => {}); // Never resolves to keep loading state active
      }
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
      }
      return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
    });

    const { container } = renderWithQuery(<AttendancePage />);

    expect(container.querySelector('.skeleton')).toBeTruthy();
  });

  it("should render error state when API fails to load today's status", async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        throw new Error('API server down');
      }
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
      }
      return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
    });

    renderWithQuery(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('API server down')).toBeTruthy();
    });
  });

  it('should render Check In button when user is not checked in today', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return { attendance: null };
      }
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    renderWithQuery(<AttendancePage />);

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
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    renderWithQuery(<AttendancePage />);

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
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
      }
      if (path === '/api/attendance/history') {
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      }
      return {};
    });

    renderWithQuery(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Attendance Completed Today')).toBeTruthy();
    });
  });

  it('should render historical records in the log table', async () => {
    vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
      if (path === '/api/attendance/today') {
        return { attendance: null };
      }
      if (path === '/api/attendance/insights') {
        return mockInsightsDefault;
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

    renderWithQuery(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('LATE')).toBeTruthy();
      expect(screen.getByText('PRESENT')).toBeTruthy();
    });
  });

  describe('Attendance Insights Features', () => {
    it('should render insights summary cards and trend timeline correctly', async () => {
      vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
        if (path === '/api/attendance/today') {
          return { attendance: null };
        }
        if (path === '/api/attendance/insights') {
          return {
            period: { startDate: '2026-08-01', endDate: '2026-08-31' },
            summary: {
              recordedDays: 5,
              presentDays: 4,
              lateDays: 1,
              halfDayDays: 0,
              absentDays: 0,
              onTimeRate: 80.0,
            },
            breakdown: [
              { date: '2026-08-01', status: 'PRESENT' },
              { date: '2026-08-02', status: 'LATE' },
            ],
          };
        }
        if (path === '/api/attendance/history') {
          return {
            history: [],
            pagination: { total: 0, limit: 10, offset: 0 },
          };
        }
        return {};
      });

      renderWithQuery(<AttendancePage />);

      await waitFor(() => {
        // Check cards values
        expect(screen.getByText('5')).toBeTruthy(); // recordedDays
        expect(screen.getByText('4')).toBeTruthy(); // presentDays
        expect(screen.getByText('1')).toBeTruthy(); // lateDays
        expect(screen.getByText('80%')).toBeTruthy(); // onTimeRate
        // Absent Days should be N/A
        expect(screen.getAllByText('N/A')).toHaveLength(1); // One N/A for absent days card
      });
    });

    it('should render N/A for onTimeRate when recordedDays is 0', async () => {
      vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
        if (path === '/api/attendance/today') {
          return { attendance: null };
        }
        if (path === '/api/attendance/insights') {
          return {
            period: { startDate: '2026-08-01', endDate: '2026-08-31' },
            summary: {
              recordedDays: 0,
              presentDays: 0,
              lateDays: 0,
              halfDayDays: 0,
              absentDays: 0,
              onTimeRate: null,
            },
            breakdown: [],
          };
        }
        if (path === '/api/attendance/history') {
          return {
            history: [],
            pagination: { total: 0, limit: 10, offset: 0 },
          };
        }
        return {};
      });

      renderWithQuery(<AttendancePage />);

      await waitFor(() => {
        expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        // Both Absent Days and On-Time Rate should display N/A
        expect(screen.getAllByText('N/A')).toHaveLength(2);
      });
    });

    it('should show loading insights state initially', async () => {
      vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
        if (path === '/api/attendance/today') {
          return { attendance: null };
        }
        if (path === '/api/attendance/insights') {
          return new Promise(() => {}); // never resolves
        }
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      });

      const { container } = renderWithQuery(<AttendancePage />);

      expect(container.querySelector('.skeleton')).toBeTruthy();
    });

    it('should show error insights state when insights fetch fails', async () => {
      vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
        if (path === '/api/attendance/today') {
          return { attendance: null };
        }
        if (path === '/api/attendance/insights') {
          throw new Error('Insights fetch failed');
        }
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      });

      renderWithQuery(<AttendancePage />);

      await waitFor(() => {
        expect(screen.getByText('Insights Error')).toBeTruthy();
        expect(screen.getByText('Insights fetch failed')).toBeTruthy();
      });
    });
  });

  describe('Attendance Manual Adjustment Notice', () => {
    it('should render the manual adjustments informational message', async () => {
      vi.mocked(client.apiClient).mockImplementation(async (path: string) => {
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsightsDefault;
        return { history: [], pagination: { total: 0, limit: 10, offset: 0 } };
      });

      renderWithQuery(<AttendancePage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Need to correct an attendance record\?/),
        ).toBeTruthy();
        expect(
          screen.getByText(/Contact HR support for manual adjustments/),
        ).toBeTruthy();
      });
    });
  });
});
