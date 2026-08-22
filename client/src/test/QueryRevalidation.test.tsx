import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as clientModule from '../api/client.js';
import { AttendancePage } from '../features/attendance/AttendancePage.js';
import { ProfilePage } from '../features/employee/ProfilePage.js';

vi.mock('../api/client.js', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    public status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com', role: 'EMPLOYEE' },
    isAuthenticated: true,
  }),
}));

vi.mock('../components/Toast/toastStore.js', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockInsights = {
  period: { startDate: '2026-08-01', endDate: '2026-08-31' },
  summary: {
    recordedDays: 2,
    presentDays: 2,
    lateDays: 0,
    halfDayDays: 0,
    absentDays: 0,
    onTimeRate: 100,
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
  pagination: { total: 1, limit: 10, offset: 0 },
};

describe('Focused TanStack Query Caching & Revalidation Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5000, // 5s staleTime for testing
        },
      },
    });
  });

  const renderWithQuery = (ui: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  it('A. should fetch initially from API and cache the results', async () => {
    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        return {};
      },
    );

    renderWithQuery(<AttendancePage />);

    // Wait for attendance page load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    expect(callCount).toBeGreaterThanOrEqual(3); // Fetch today, history, insights
  });

  it('B. should render cached data on remount and not perform duplicate network requests if data is fresh', async () => {
    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        return {};
      },
    );

    const { unmount } = renderWithQuery(<AttendancePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });
    const firstCallCount = callCount;

    // Unmount and remount with the same client (within staleTime)
    unmount();
    renderWithQuery(<AttendancePage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    // Should not have made new network calls since staleTime is 5s and it is still fresh
    expect(callCount).toBe(firstCallCount);
  });

  it('C. should trigger refetch on remount if query is stale', async () => {
    // Set staleTime to 0 to make it instantly stale
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 0,
        retry: false,
      },
    });

    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        return {};
      },
    );

    const { unmount } = renderWithQuery(<AttendancePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });
    const firstCallCount = callCount;

    unmount();
    renderWithQuery(<AttendancePage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    // Stale queries refetch on mount, so callCount should increase
    expect(callCount).toBeGreaterThan(firstCallCount);
  });

  it('D. should invalidate and refetch all attendance queries on successful check-in/out mutations', async () => {
    let callCount = 0;
    let checkInCalled = false;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') {
          return checkInCalled
            ? {
                attendance: {
                  id: 'att-1',
                  date: '2026-08-22',
                  checkIn: '2026-08-22T09:00:00.000Z',
                  checkOut: null,
                  status: 'PRESENT',
                },
              }
            : { attendance: null };
        }
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        if (path === '/api/attendance/check-in') {
          checkInCalled = true;
          return {
            attendance: {
              id: 'att-1',
              date: '2026-08-22',
              checkIn: '2026-08-22T09:00:00.000Z',
              checkOut: null,
              status: 'PRESENT',
            },
          };
        }
        return {};
      },
    );

    renderWithQuery(<AttendancePage />);

    // Wait for load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    const preMutationCalls = callCount;

    // Trigger check-in
    const checkInBtn = screen.getByRole('button', {
      name: 'Submit check-in for today',
    });
    fireEvent.click(checkInBtn);

    // Verify it updates to check-out state automatically and queries refetch
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-out for today' }),
      ).toBeTruthy();
    });

    expect(callCount).toBeGreaterThan(preMutationCalls);
  });

  it('E. should trigger query revalidation on window focus', async () => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 0,
      },
    });

    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        return {};
      },
    );

    renderWithQuery(<AttendancePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    const preFocusCalls = callCount;

    // Simulate focus using TanStack Query focusManager
    import('@tanstack/react-query').then(({ focusManager }) => {
      focusManager.setFocused(true);
    });

    // Verify queries revalidate
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(preFocusCalls);
    });
  });

  it('F. should trigger query revalidation on network reconnect', async () => {
    const { onlineManager } = await import('@tanstack/react-query');
    // Start offline
    onlineManager.setOnline(false);

    queryClient.setDefaultOptions({
      queries: {
        staleTime: 0,
      },
    });

    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        callCount++;
        if (path === '/api/attendance/today') return { attendance: null };
        if (path === '/api/attendance/insights') return mockInsights;
        if (path === '/api/attendance/history') return mockHistory;
        return {};
      },
    );

    renderWithQuery(<AttendancePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    const preReconnectCalls = callCount;

    // Simulate online event
    onlineManager.setOnline(true);

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(preReconnectCalls);
    });
  });

  it('G. should support offline rendering of cached data even when API fails', async () => {
    let count = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(
      async (path: string) => {
        count++;
        if (count <= 3) {
          if (path === '/api/attendance/today') return { attendance: null };
          if (path === '/api/attendance/insights') return mockInsights;
          if (path === '/api/attendance/history') return mockHistory;
        }
        // Fail on subsequent fetches (simulating offline/network error)
        throw new Error('Network error');
      },
    );

    const { unmount } = renderWithQuery(<AttendancePage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });

    // Make queries stale
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 0,
      },
    });

    // Unmount and remount. Since we are "offline", the fetch will fail.
    // However, TanStack Query still yields the cached data from memory and retains it.
    unmount();
    renderWithQuery(<AttendancePage />);

    // Verification: cached data is still present in the document and not replaced by a blank error screen
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Submit check-in for today' }),
      ).toBeTruthy();
    });
  });

  it('H. should handle error retry limits appropriately', async () => {
    // Configure client to retry once
    const customClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          retryDelay: 0, // Instant retry for test speed
        },
      },
    });

    let callCount = 0;
    vi.mocked(clientModule.apiClient).mockImplementation(async () => {
      callCount++;
      throw new Error('API server down');
    });

    render(
      <QueryClientProvider client={customClient}>
        <ProfilePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('API server down')).toBeTruthy();
    });

    // Initial call (1) + Retry (1) = 2 calls
    expect(callCount).toBe(2);
  });
});
