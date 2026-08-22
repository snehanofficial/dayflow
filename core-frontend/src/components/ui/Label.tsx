import React from 'react';
import { clsx } from 'clsx';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  children,
  className = '',
  required = false,
  ...props
}: LabelProps) {
  return (
    <label className={clsx('form-label', className)} {...props}>
      {children}
      {required && (
        <span
          className="form-required"
          aria-hidden="true"
          title="This field is required"
        >
          *
        </span>
      )}
    </label>
  );
}
