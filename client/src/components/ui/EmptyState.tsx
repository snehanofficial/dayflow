import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        textAlign: 'center',
        border: '1px dashed var(--color-border-interactive)',
        borderRadius: 'var(--radius-md)',
        gap: '1rem',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '320px',
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
export default EmptyState;
