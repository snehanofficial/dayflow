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
  Clock,
  Calendar,
  CreditCard,
  BarChart3,
  Bell,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { navigationConfig, type NavItem } from '../config/navigation.js';
import { Dropdown, Tooltip } from './ui/index.js';
import { toast } from './Toast/toastStore.js';
import { SearchPalette } from './SearchPalette.js';

import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

function renderIcon(icon?: string) {
  switch (icon) {
    case 'analytics':
      return <BarChart3 size={16} aria-hidden="true" />;
    case 'payroll':
      return <CreditCard size={16} aria-hidden="true" />;
    case 'calendar':
      return <Calendar size={16} aria-hidden="true" />;
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
    case 'clock':
      return <Clock size={16} aria-hidden="true" />;
    default:
      return null;
  }
}

// ─── AppShell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      toast.info('Connection restored.');
    } else if (!isOnline && prevOnline.current) {
      toast.warning('Connection lost. Working offline.');
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

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

  // Notifications logic
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData, refetch: refetchNotifications } = useQuery<{
    notifications: {
      id: string;
      userId: string;
      title: string;
      message: string;
      type: string;
      read: boolean;
      createdAt: string;
    }[];
  }>({
    queryKey: ['notifications'],
    queryFn: () =>
      apiClient<{
        notifications: {
          id: string;
          userId: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          createdAt: string;
        }[];
      }>('/api/notifications'),
    refetchInterval: 10000,
    enabled: !!user,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/api/notifications/mark-read', { method: 'POST' });
      refetchNotifications();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkIndividualRead = async (id: string) => {
    try {
      await apiClient('/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ ids: [id] }),
      });
      refetchNotifications();
    } catch {
      // Ignore click error
    }
  };

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
          (!item.requiredPermission ||
            hasPermission(
              item.requiredPermission.resource,
              item.requiredPermission.action,
            )) &&
          (!item.requiredRole ||
            (user &&
              user.role &&
              user.role.toUpperCase() === item.requiredRole.toUpperCase())),
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
          {/* Notifications Widget */}
          <div
            className="notifications-widget-container"
            ref={notificationsRef}
          >
            <button
              type="button"
              className="notifications-bell-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="View notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={15} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="notifications-badge" role="status">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <span className="notifications-title">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notifications-mark-read-btn"
                      onClick={handleMarkAllRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      <Bell
                        size={24}
                        aria-hidden="true"
                        style={{ strokeWidth: 1.5 }}
                      />
                      <span className="notification-empty-text">
                        No notifications yet.
                      </span>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      let typeIcon = <Bell size={12} />;
                      let typeClass = 'notification-icon-leave-status';

                      if (n.type === 'LEAVE_REQUEST') {
                        typeIcon = <Calendar size={12} />;
                        typeClass = 'notification-icon-leave-request';
                      } else if (n.type === 'LEAVE_STATUS') {
                        typeIcon = <Calendar size={12} />;
                        typeClass = 'notification-icon-leave-status';
                      } else if (n.type === 'PAYROLL_GENERATED') {
                        typeIcon = <CreditCard size={12} />;
                        typeClass = 'notification-icon-payroll';
                      }

                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={clsx(
                            'notification-item',
                            !n.read && 'unread',
                          )}
                          onClick={() => {
                            handleMarkIndividualRead(n.id);
                          }}
                        >
                          <div
                            className={clsx(
                              'notification-icon-container',
                              typeClass,
                            )}
                          >
                            {typeIcon}
                          </div>
                          <div className="notification-content">
                            <span className="notification-item-title">
                              {n.title}
                            </span>
                            <span className="notification-item-message">
                              {n.message}
                            </span>
                            <span className="notification-item-time">
                              {new Date(n.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          </div>
                          {!n.read && (
                            <div className="notification-unread-dot" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
