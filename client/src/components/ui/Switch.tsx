import React from 'react';
import { clsx } from 'clsx';

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={clsx('switch-container', className)}>
        <span className="switch-text">{label}</span>
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          role="switch"
          {...props}
        />
        <div className="switch-track">
          <div className="switch-thumb" />
        </div>
      </label>
    );
  },
);
Switch.displayName = 'Switch';
