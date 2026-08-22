import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  X,
  LayoutDashboard,
  Activity,
  Settings,
  User,
  Users,
  Shield,
  LogOut,
  Palette,
  Command,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { apiClient } from '../api/client.js';
import { config } from '../config.js';
import { toast } from './Toast/toastStore.js';

interface FuzzyResult {
  score: number;
  highlightIndices: number[];
}

export function fuzzyMatch(text: string, query: string): FuzzyResult | null {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (!queryLower) {
    return { score: 0, highlightIndices: [] };
  }

  let queryIdx = 0;
  let textIdx = 0;
  const highlightIndices: number[] = [];
  let score = 0;
  let consecutiveMatches = 0;

  while (queryIdx < queryLower.length && textIdx < textLower.length) {
    if (textLower[textIdx] === queryLower[queryIdx]) {
      highlightIndices.push(textIdx);
      // Reward consecutive matching letters
      score += 2 + consecutiveMatches * 2;

      // Extra bonus for matching beginning of words
      if (
        textIdx === 0 ||
        textLower[textIdx - 1] === ' ' ||
        textLower[textIdx - 1] === '/'
      ) {
        score += 12;
      }
      queryIdx++;
      consecutiveMatches++;
    } else {
      consecutiveMatches = 0;
    }
    textIdx++;
  }

  if (queryIdx < queryLower.length) {
    return null;
  }

  // Slight penalty for longer words
  score -= (text.length - query.length) * 0.4;

  return { score, highlightIndices };
}

function HighlightedText({
  text,
  indices,
}: {
  text: string;
  indices: number[];
}) {
  if (indices.length === 0) return <span>{text}</span>;

  const elements: React.ReactNode[] = [];
  const indexSet = new Set(indices);

  for (let i = 0; i < text.length; i++) {
    if (indexSet.has(i)) {
      elements.push(
        <mark key={i} className="search-highlight">
          {text[i]}
        </mark>,
      );
    } else {
      elements.push(text[i]);
    }
  }

  return <span>{elements}</span>;
}

function renderSearchIcon(iconName: string) {
  switch (iconName) {
    case 'dashboard':
      return <LayoutDashboard size={16} aria-hidden="true" />;
    case 'diagnostics':
      return <Activity size={16} aria-hidden="true" />;
    case 'settings':
      return <Settings size={16} aria-hidden="true" />;
    case 'user':
      return <User size={16} aria-hidden="true" />;
    case 'users':
      return <Users size={16} aria-hidden="true" />;
    case 'shield':
      return <Shield size={16} aria-hidden="true" />;
    case 'logout':
      return <LogOut size={16} aria-hidden="true" />;
    case 'palette':
      return <Palette size={16} aria-hidden="true" />;
    default:
      return <Command size={16} aria-hidden="true" />;
  }
}

interface SearchItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Users';
  title: string;
  subtitle: string;
  icon: string;
  action: () => void | Promise<void>;
}

interface SearchPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SearchPalette({ isOpen, setIsOpen }: SearchPaletteProps) {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const { setTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<
    Array<{ id: string; email: string }>
  >([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Manage body scroll lock and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Clear input state when opening
      setQuery('');
      setSelectedIndex(0);
      setUserResults([]);

      // Delayed focus to work around animation rendering timing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    }
  }, [isOpen]);

  // Debounced query trigger for user search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Query backend search API
  useEffect(() => {
    if (!isOpen || !debouncedQuery.trim()) {
      setUserResults([]);
      return;
    }

    let active = true;
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const res = await apiClient<{
          users: Array<{ id: string; email: string }>;
        }>(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (active) {
          setUserResults(res.users);
        }
      } catch {
        // Dynamic search error ignored in starter template
      } finally {
        if (active) {
          setIsLoadingUsers(false);
        }
      }
    };

    fetchUsers();
    return () => {
      active = false;
    };
  }, [debouncedQuery, isOpen]);

  // Localized static items base list
  const staticItems = useMemo<SearchItem[]>(() => {
    if (!user) return [];
    return [
      {
        id: 'nav-dashboard',
        category: 'Navigation' as const,
        title: 'Dashboard',
        subtitle: 'Go to main dashboard home page',
        icon: 'dashboard',
        action: () => navigate('/'),
      },
      ...(hasPermission('resources', 'read')
        ? [
            {
              id: 'nav-diagnostics',
              category: 'Navigation' as const,
              title: 'Diagnostics',
              subtitle: 'Check API connections and service status',
              icon: 'diagnostics',
              action: () => navigate('/diagnostics'),
            },
          ]
        : []),
      ...(config.isDev
        ? [
            {
              id: 'nav-playground',
              category: 'Navigation' as const,
              title: 'UI Playground',
              subtitle: 'Inspect design components and theme tokens',
              icon: 'shield',
              action: () => navigate('/playground'),
            },
          ]
        : []),
      {
        id: 'action-theme-light',
        category: 'Actions' as const,
        title: 'Set Theme to Light',
        subtitle: 'Switch application color theme to light mode',
        icon: 'palette',
        action: () => setTheme('light'),
      },
      {
        id: 'action-theme-dark',
        category: 'Actions' as const,
        title: 'Set Theme to Dark',
        subtitle: 'Switch application color theme to dark mode',
        icon: 'palette',
        action: () => setTheme('dark'),
      },
      {
        id: 'action-theme-system',
        category: 'Actions' as const,
        title: 'Set Theme to System',
        subtitle: 'Follow your operating system theme preferences',
        icon: 'palette',
        action: () => setTheme('system'),
      },
      {
        id: 'action-logout',
        category: 'Actions' as const,
        title: 'Sign Out / Logout',
        subtitle: 'End your current session and sign out securely',
        icon: 'logout',
        action: async () => {
          try {
            await logout();
            toast.success('Signed out.');
            navigate('/login');
          } catch {
            toast.error('Logout failed.');
          }
        },
      },
      {
        id: 'action-404',
        category: 'Actions' as const,
        title: 'Trigger 404 Page',
        subtitle: 'Navigate to the Not Found handler diagnostics route',
        icon: 'shield',
        action: () => navigate('/unmapped-route-xyz'),
      },
    ];
  }, [user, navigate, hasPermission, setTheme, logout]);

  // Compute fuzzy matched lists
  const processedResults = useMemo(() => {
    const matchedStatic = staticItems
      .map((item) => {
        // Match both title and subtitle
        const fuzzyTitle = fuzzyMatch(item.title, query);
        const fuzzySubtitle = fuzzyMatch(item.subtitle, query);
        if (query && !fuzzyTitle && !fuzzySubtitle) return null;

        return {
          ...item,
          fuzzy: fuzzyTitle ||
            fuzzySubtitle || { score: 0, highlightIndices: [] },
        };
      })
      .filter((item) => item !== null) as Array<
      SearchItem & { fuzzy: FuzzyResult }
    >;

    // Sort static results by fuzzy score descending
    if (query) {
      matchedStatic.sort((a, b) => b.fuzzy.score - a.fuzzy.score);
    }

    const matchedUsers = userResults.map((u) => {
      const fuzzy = fuzzyMatch(u.email, query) || {
        score: 0,
        highlightIndices: [],
      };
      return {
        id: `user-${u.id}`,
        category: 'Users' as const,
        title: u.email,
        subtitle: `User ID: ${u.id}`,
        icon: 'user',
        fuzzy,
        action: () => {
          toast.info(`Selected user profile: ${u.email}`);
          setIsOpen(false);
        },
      };
    });

    const flatResults: Array<SearchItem & { fuzzy: FuzzyResult }> = [];
    const navs = matchedStatic.filter((i) => i.category === 'Navigation');
    const actions = matchedStatic.filter((i) => i.category === 'Actions');

    flatResults.push(...navs);
    flatResults.push(...actions);
    flatResults.push(...matchedUsers);

    return {
      flatResults,
      categories: {
        Navigation: navs,
        Actions: actions,
        Users: matchedUsers,
      },
    };
  }, [query, staticItems, userResults, setIsOpen]);

  const { flatResults, categories } = processedResults;

  // Reset selected item index when query parameters update
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, userResults]);

  // Keybindings for inside the open modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatResults.length > 0 ? (prev + 1) % flatResults.length : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatResults.length > 0
            ? (prev - 1 + flatResults.length) % flatResults.length
            : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = flatResults[selectedIndex];
        if (activeItem) {
          activeItem.action();
          setIsOpen(false);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, setIsOpen]);

  if (!isOpen) return null;

  // Track absolute render index while mapping categories to flattened index
  let absoluteIndexOffset = 0;

  return (
    <div
      className="search-palette-overlay"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Global search palette"
    >
      <div
        className="search-palette-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="search-palette-input-container">
          <Search size={18} className="search-palette-item-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="Search pages, actions, and users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoadingUsers ? (
            <Loader2
              size={16}
              className="animate-spin text-muted"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          ) : (
            <button
              className="dialog-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close search"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="search-palette-results">
          {flatResults.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8) var(--space-4)',
                color: 'var(--color-text-muted)',
                fontSize: '0.8125rem',
              }}
            >
              No matching pages, actions, or users found.
            </div>
          ) : (
            Object.entries(categories).map(([groupName, groupItems]) => {
              if (groupItems.length === 0) return null;

              const renderGroup = (
                <div key={groupName} className="search-palette-group">
                  <div className="search-palette-group-title">{groupName}</div>
                  {groupItems.map((item) => {
                    const currentIdx = absoluteIndexOffset;
                    absoluteIndexOffset++;
                    const isActive = currentIdx === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        className={`search-palette-item ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setSelectedIndex(currentIdx)}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                      >
                        <span className="search-palette-item-icon">
                          {renderSearchIcon(item.icon)}
                        </span>
                        <div className="search-palette-item-content">
                          <div className="search-palette-item-title">
                            <HighlightedText
                              text={item.title}
                              indices={item.fuzzy.highlightIndices}
                            />
                          </div>
                          <div className="search-palette-item-subtitle">
                            {item.subtitle}
                          </div>
                        </div>
                        <span className="search-palette-item-action">
                          Enter ↵
                        </span>
                      </div>
                    );
                  })}
                </div>
              );

              return renderGroup;
            })
          )}
        </div>

        {/* Footer Navigation Tips */}
        <div className="search-palette-footer">
          <div className="search-palette-footer-item">
            <kbd>↑↓</kbd> <span>to navigate</span>
          </div>
          <div className="search-palette-footer-item">
            <kbd>↵</kbd> <span>to select</span>
          </div>
          <div className="search-palette-footer-item">
            <kbd>esc</kbd> <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
