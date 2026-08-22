import { config } from '../config.js';

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  requiredPermission?: { resource: string; action: string };
  requiredRole?: string;
  badge?: {
    text: string;
    variant?:
      'success' | 'error' | 'warning' | 'info' | 'secondary' | 'primary';
  };
  children?: Omit<NavItem, 'icon' | 'children'>[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

const baseGroups: NavGroup[] = [
  {
    group: 'General',
    items: [
      { label: 'Dashboard', route: '/', icon: 'dashboard' },
      { label: 'Profile', route: '/profile', icon: 'profile' },
      { label: 'Attendance', route: '/attendance', icon: 'clock' },
      {
        label: 'Directory',
        route: '/employees',
        icon: 'users',
        requiredRole: 'HR',
      },
      {
        label: 'Diagnostics',
        route: '/diagnostics',
        icon: 'diagnostics',
        requiredPermission: { resource: 'resources', action: 'read' },
      },
    ],
  },
  {
    group: 'Time Off',
    items: [
      {
        label: 'Leaves',
        route: '/leave',
        icon: 'calendar',
        requiredPermission: { resource: 'leave', action: 'read' },
      },
      {
        label: 'Manage Leaves',
        route: '/hr/leave',
        icon: 'users',
        requiredPermission: { resource: 'leave', action: 'manage' },
      },
    ],
  },
  {
    group: 'Payroll',
    items: [
      {
        label: 'My Pay',
        route: '/payroll/slips',
        icon: 'payroll',
        requiredPermission: { resource: 'payroll', action: 'read' },
      },
      {
        label: 'Manage Payroll',
        route: '/hr/payroll',
        icon: 'shield',
        requiredPermission: { resource: 'payroll', action: 'manage' },
      },
    ],
  },
  {
    group: 'Analytics',
    items: [
      {
        label: 'HR Intelligence',
        route: '/hr/analytics',
        icon: 'analytics',
        requiredPermission: { resource: 'analytics', action: 'read' },
      },
    ],
  },
];

// Append playground for developer inspection in local development
if (config.isDev) {
  const generalGroup = baseGroups.find((g) => g.group === 'General');
  if (generalGroup) {
    generalGroup.items.push({
      label: 'UI Playground',
      route: '/playground',
      icon: 'shield',
      badge: { text: 'Dev', variant: 'secondary' },
    });
  }
}

export const navigationConfig = baseGroups;
