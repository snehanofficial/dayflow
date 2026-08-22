import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx('form-textarea', error && 'border-error', className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
