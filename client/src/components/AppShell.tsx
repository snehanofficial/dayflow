import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { clsx } from 'clsx';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Activity,
  Settings,
  User,
  Users,
  Shield,
  HelpCircle,
  Palette,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { navigationConfig, type NavItem } from '../config/navigation.js';
import { Dropdown, Tooltip } from './ui/index.js';
import { toast } from './Toast/toastStore.js';
import { SearchPalette } from './SearchPalette.js';

function renderIcon(icon?: string) {
  switch (icon) {
    case 'dashboard':
      return <LayoutDashboard size={16} aria-hidden="true" />;
    case 'diagnostics':
      return <Activity size={16} aria-hidden="true" />;
    case 'settings':
      return <Settings size={16} aria-hidden="true" />;
    case 'profile':
      return <User size={16} aria-hidden="true" />;
    case 'users':
      return <Users size={16} aria-hidden="true" />;
    case 'shield':
      return <Shield size={16} aria-hidden="true" />;
    case 'help':
      return <HelpCircle size={16} aria-hidden="true" />;
    default:
      return null;
  }
}

// ─── Network status hook ────────────────────────────────────────────────────

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Connection restored.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Connection lost. Working offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ─── AppShell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop collapsed preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Mobile drawer toggle
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMobileOpen = useRef(isMobileOpen);

  // Global search palette visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K keyboard shortcut to toggle search palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out.');
      navigate('/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Restore focus to trigger when drawer closes
  useEffect(() => {
    if (!isMobileOpen && wasMobileOpen.current) {
      menuTriggerRef.current?.focus();
    }
    wasMobileOpen.current = isMobileOpen;
  }, [isMobileOpen]);

  // Body scroll lock + focus trap when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      if (mobileDrawerRef.current) {
        const focusable = mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Escape key closes mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const filteredNavConfig = navigationConfig
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.requiredPermission ||
          hasPermission(
            item.requiredPermission.resource,
            item.requiredPermission.action,
          ),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const isItemActive = (item: NavItem) => {
    if (location.pathname === item.route) return true;
    if (item.children) {
      return item.children.some((child) => location.pathname === child.route);
    }
    return false;
  };

  const renderNavLinks = (onClick?: () => void) => (
    <>
      {filteredNavConfig.map((group) => (
        <div key={group.group} style={{ marginBottom: 'var(--space-4)' }}>
          <div className="nav-group-header">{group.group}</div>
          {group.items.map((item) => {
            const active = isItemActive(item);

            const linkEl = (
              <NavLink
                to={item.route}
                end={item.route === '/'}
                className={({ isActive }) =>
                  clsx('nav-link', (isActive || active) && 'active')
                }
                aria-label={item.label}
                onClick={onClick}
              >
                <span className="nav-link-icon">{renderIcon(item.icon)}</span>
                <span className="nav-link-text">{item.label}</span>
                {item.badge && !isCollapsed && (
                  <span
                    className={clsx(
                      'badge',
                      item.badge.variant
                        ? `badge-${item.badge.variant}`
                        : 'badge-default',
                    )}
                    style={{ marginLeft: 'auto', fontSize: '0.6875rem' }}
                  >
                    {item.badge.text}
                  </span>
                )}
              </NavLink>
            );

            return isCollapsed ? (
              <Tooltip key={item.route} content={item.label} position="right">
                {linkEl}
              </Tooltip>
            ) : (
              <div key={item.route}>
                {linkEl}
                {item.children && item.children.length > 0 && (
                  <div className="nav-children">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.route}
                        to={child.route}
                        className={({ isActive }) =>
                          clsx('nav-sub-link', isActive && 'active')
                        }
                        onClick={onClick}
                      >
                        <span>{child.label}</span>
                        {child.badge && (
                          <span
                            className={clsx(
                              'badge',
                              child.badge.variant
                                ? `badge-${child.badge.variant}`
                                : 'badge-default',
                            )}
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.625rem',
                            }}
                          >
                            {child.badge.text}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );

  const themeLabel =
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutText = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <div className="app-container app-layout">
      {/* Skip to Main Content link for keyboard accessibility */}
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>

      {/* Global Search Palette */}
      <SearchPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />

      {/* Top bar Header */}
      <header className="top-bar app-header">
        <div className="brand-section">
          <button
            type="button"
            className="menu-toggle-btn"
            ref={menuTriggerRef}
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileOpen}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="brand-name">DayFlow</span>
          {/* Offline indicator — only shown when offline, not noisy when online */}
          {!isOnline && (
            <span
              className="offline-indicator"
              role="status"
              aria-live="polite"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                padding: '2px var(--space-2)',
                borderRadius: 'var(--radius-xs)',
                marginLeft: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger)',
                }}
              />
              Offline
            </span>
          )}
        </div>

        {/* Global Search trigger button */}
        <button
          type="button"
          className="topbar-search-trigger"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search pages, actions, and users"
        >
          <Search size={14} aria-hidden="true" />
          <span>Search...</span>
          <kbd className="topbar-search-kbd">{shortcutText}</kbd>
        </button>

        <div className="topbar-actions">
          {/* Theme switcher */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="topbar-icon-btn"
                aria-label="Change theme"
              >
                <Palette size={13} aria-hidden="true" />
                <span>{themeLabel}</span>
              </button>
            }
            items={[
              { label: 'Light', onClick: () => setTheme('light') },
              { label: 'Dark', onClick: () => setTheme('dark') },
              { label: 'System', onClick: () => setTheme('system') },
            ]}
          />

          {/* User account */}
          {user && (
            <>
              <div className="topbar-divider" aria-hidden="true" />
              <div className="topbar-user">
                <span className="topbar-user-email">{user.email}</span>
                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={handleLogout}
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="shell-layout">
        {/* Persistent Collapsible Sidebar for Desktop */}
        <aside
          className={clsx('app-sidebar', isCollapsed && 'collapsed')}
          aria-label="Main navigation"
        >
          <nav className="nav-scrollable" aria-label="Application navigation">
            {renderNavLinks()}
          </nav>
          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight size={14} aria-hidden="true" />
              ) : (
                <ChevronLeft size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Sliding Drawer Navigation */}
        {isMobileOpen && (
          <div
            className="mobile-drawer-overlay"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          >
            <div
              className={clsx('mobile-drawer', isMobileOpen && 'open')}
              ref={mobileDrawerRef}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
            >
              <div className="mobile-drawer-header">
                <span className="brand-name">DayFlow</span>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <nav
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 'var(--space-3) 0',
                }}
                aria-label="Mobile navigation"
              >
                {renderNavLinks(() => setIsMobileOpen(false))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Region */}
        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AppShell;
