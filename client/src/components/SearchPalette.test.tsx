import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchPalette, fuzzyMatch } from './SearchPalette.js';

// Setup stable mock handlers
const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockSetTheme = vi.fn();
const mockHasPermission = vi.fn((_resource?: string, _action?: string) => true);
const mockApiClient = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>();
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

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
    setTheme: mockSetTheme,
  }),
}));

vi.mock('../api/client.js', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SearchPalette Fuzzy Scorer', () => {
  it('should match direct substrings', () => {
    const res = fuzzyMatch('Dashboard', 'dash');
    expect(res).not.toBeNull();
    expect(res?.highlightIndices).toEqual([0, 1, 2, 3]);
  });

  it('should support subsequence match and score word boundaries', () => {
    const res1 = fuzzyMatch('Dashboard Home', 'dashhome');
    expect(res1).not.toBeNull();

    // Exact prefix match should score higher than subsequence match
    const resExact = fuzzyMatch('Dashboard Home', 'dashboard');
    const resSub = fuzzyMatch('Dashboard Home', 'dbhome');
    expect(resExact?.score).toBeGreaterThan(resSub?.score || 0);
  });

  it('should return null for non-matching queries', () => {
    expect(fuzzyMatch('Dashboard', 'xyz')).toBeNull();
  });
});

describe('SearchPalette Component', () => {
  const mockSetIsOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.mockImplementation((url) => {
      if (url.includes('/api/employees')) {
        return Promise.resolve({ employees: [] });
      }
      return Promise.resolve({ users: [] });
    });
  });

  it('should render nothing when isOpen is false', () => {
    renderWithProviders(
      <SearchPalette isOpen={false} setIsOpen={mockSetIsOpen} />,
    );
    expect(
      screen.queryByPlaceholderText('Search pages, actions, and users...'),
    ).toBeNull();
  });

  it('should render search layout structures when isOpen is true', () => {
    renderWithProviders(
      <SearchPalette isOpen={true} setIsOpen={mockSetIsOpen} />,
    );

    expect(
      screen.getByPlaceholderText('Search pages, actions, and users...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('to navigate')).toBeInTheDocument();
  });

  it('should filter items statically as query is typed', () => {
    const { container } = renderWithProviders(
      <SearchPalette isOpen={true} setIsOpen={mockSetIsOpen} />,
    );

    const input = screen.getByPlaceholderText(
      'Search pages, actions, and users...',
    );
    fireEvent.change(input, { target: { value: 'Light' } });

    // "Set Theme to Light" should remain visible, but "Dashboard" should disappear
    const titleElement = container.querySelector('.search-palette-item-title');
    expect(titleElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Set Theme to Light',
    );
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('should fetch and display users dynamically from backend on debounced search input', async () => {
    mockApiClient.mockImplementation((url) => {
      if (url.includes('/api/employees')) {
        return Promise.resolve({ employees: [] });
      }
      return Promise.resolve({
        users: [{ id: 'usr-1', email: 'dynamic-user-search@example.com' }],
      });
    });

    const { container } = renderWithProviders(
      <SearchPalette isOpen={true} setIsOpen={mockSetIsOpen} />,
    );

    const input = screen.getByPlaceholderText(
      'Search pages, actions, and users...',
    );
    fireEvent.change(input, { target: { value: 'dynamic-user' } });

    // Wait for debounce and dynamic search API resolving
    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
      const userElement = container.querySelector('.search-palette-item-title');
      expect(userElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'dynamic-user-search@example.com',
      );
    });
  });

  it('should support arrow key index selection and action execution via Enter key', () => {
    renderWithProviders(
      <SearchPalette isOpen={true} setIsOpen={mockSetIsOpen} />,
    );

    // Initial selected index is 0 (Dashboard)
    // Press ArrowDown to select index 1 (Profile)
    // Flat results: [Dashboard, Profile, Attendance, Directory, Diagnostics, ...]

    // Press ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Press Enter to trigger action for Profile page navigation
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('should trigger close function when Escape key is pressed', () => {
    renderWithProviders(
      <SearchPalette isOpen={true} setIsOpen={mockSetIsOpen} />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });
});
