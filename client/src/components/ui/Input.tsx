import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, startIcon, endIcon, style, ...props }, ref) => {
    const hasIcon = !!startIcon || !!endIcon;
    const inputEl = (
      <input
        ref={ref}
        className={clsx(
          'form-input',
          error && 'border-error',
          startIcon && 'has-start-icon',
          endIcon && 'has-end-icon',
          className,
        )}
        style={style}
        {...props}
      />
    );

    if (hasIcon) {
      return (
        <div className="input-container">
          {startIcon && <div className="input-start-slot">{startIcon}</div>}
          {inputEl}
          {endIcon && <div className="input-end-slot">{endIcon}</div>}
        </div>
      );
    }

    return inputEl;
  },
);
Input.displayName = 'Input';
export default Input;
