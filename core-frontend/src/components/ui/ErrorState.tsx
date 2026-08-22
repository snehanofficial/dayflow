import { Button } from './Button.js';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-container">
      <div>
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-error)',
            marginBottom: 'var(--space-1)',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          style={{ height: 32, fontSize: '0.75rem' }}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
export default ErrorState;
