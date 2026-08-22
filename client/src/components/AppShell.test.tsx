import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './AppShell.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQuery = (ui: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

// Mock contexts to satisfy hook dependencies
const mockLogout = vi.fn();
const mockHasPermission = vi.fn((_resource?: string, _action?: string) => true);

vi.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com', permissions: ['*'] },
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
    hasPermission: mockHasPermission,
    checkAuth: vi.fn(),
  }),
}));

vi.mock('../context/ThemeContext.js', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: vi.fn(),
  }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it('should render structural layout elements and support accessibility contracts', () => {
    const { container } = renderWithQuery(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route
              index
              element={<div data-testid="child-element">Child View</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Assert semantic layout container element exists
    const layout = container.querySelector('.app-layout');
    expect(layout).not.toBeNull();

    // Assert semantic header structure exists
    const header = container.querySelector('header.app-header');
    expect(header).not.toBeNull();

    // Assert main tag exists with correct ID and accessibility index (tabIndex={-1} for keyboard focusing skip-links)
    const main = screen.getByRole('main');
    expect(main).not.toBeNull();
    expect(main.getAttribute('id')).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');

    // Assert that the Outlet correctly renders child route contents
    const child = screen.getByTestId('child-element');
    expect(child).not.toBeNull();
    expect(child.textContent).toBe('Child View');
  });

  it('should toggle collapsed sidebar state and persist in localStorage', () => {
    const { container } = renderWithQuery(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />} />
        </Routes>
      </MemoryRouter>,
    );

    const sidebar = container.querySelector('aside.app-sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.classList.contains('collapsed')).toBe(false);

    // Find collapse button and click it
    const toggleBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleBtn);

    // Verify it is collapsed and persisted in localStorage
    expect(sidebar?.classList.contains('collapsed')).toBe(true);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');

    // Expand again
    fireEvent.click(screen.getByLabelText('Expand sidebar'));
    expect(sidebar?.classList.contains('collapsed')).toBe(false);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
  });

  it('should load initial collapsed state from localStorage', () => {
    localStorage.setItem('sidebar-collapsed', 'true');
    const { container } = renderWithQuery(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />} />
        </Routes>
      </MemoryRouter>,
    );

    const sidebar = container.querySelector('aside.app-sidebar');
    expect(sidebar?.classList.contains('collapsed')).toBe(true);
  });

  it('should filter items based on permissions', () => {
    mockHasPermission.mockImplementation((resource?: string) => {
      if (resource === 'resources') return false;
      return true;
    });

    renderWithQuery(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />} />
        </Routes>
      </MemoryRouter>,
    );

    // Dashboard should be visible
    expect(screen.queryByLabelText('Dashboard')).not.toBeNull();
    // Diagnostics should be filtered out
    expect(screen.queryByLabelText('Diagnostics')).toBeNull();
  });
});
