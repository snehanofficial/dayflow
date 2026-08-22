import React from 'react';
import { clsx } from 'clsx';

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={clsx('checkbox-container', className)}>
        <input type="checkbox" ref={ref} className="sr-only" {...props} />
        <div className="checkbox-element">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="checkbox-text">{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
