import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary.js';

function ThrowsError(): null {
  throw new Error('Test rendering crash exception');
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  const originalLocation = window.location;

  beforeEach(() => {
    // Suppress console.error crash logging during boundary tests to keep test output clean
    console.error = vi.fn();

    // Mock window.location reload behavior in JSDOM
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should render children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div data-testid="safe-child">Safe Content</div>
      </ErrorBoundary>,
    );

    const safeChild = screen.getByTestId('safe-child');
    expect(safeChild).not.toBeNull();
    expect(safeChild.textContent).toBe('Safe Content');
  });

  it('should catch rendering errors and display fallback message with reload action button', () => {
    render(
      <ErrorBoundary>
        <ThrowsError />
      </ErrorBoundary>,
    );

    // Verify fallback UI is rendered
    const title = screen.getByRole('heading', { level: 2 });
    expect(title.textContent).toBe('Application Error');

    const message = screen.getByText('Test rendering crash exception');
    expect(message).not.toBeNull();

    // Verify recovery reload button is present
    const button = screen.getByRole('button', { name: /Reload Application/i });
    expect(button).not.toBeNull();

    // Verify clicking triggers recovery reload
    fireEvent.click(button);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
