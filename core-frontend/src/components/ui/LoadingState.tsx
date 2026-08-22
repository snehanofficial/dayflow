export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="state-container">
      <div className="spinner" role="status" aria-label={message} />
      <p
        style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}
      >
        {message}
      </p>
    </div>
  );
}
export default LoadingState;
