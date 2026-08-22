import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx('badge', `badge-${variant}`, className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);
