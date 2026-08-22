import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Playground } from './Playground.js';

// Mock sonner module to avoid side effects
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('Playground Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the header and basic tab items', () => {
    render(<Playground />);

    // Assert main page heading renders
    expect(screen.getByText('UI Playground')).toBeTruthy();

    // Assert tabs are present
    expect(screen.getByText('Basic Primitives')).toBeTruthy();
    expect(screen.getByText('Forms & Validation')).toBeTruthy();
    expect(screen.getByText('Overlays & Feedback')).toBeTruthy();
  });

  it('should switch tabs and show corresponding sections', () => {
    render(<Playground />);

    // By default, 'Basic Primitives' tab is active. Assert buttons section is rendered.
    expect(screen.getByText('Buttons')).toBeTruthy();
    expect(
      screen.queryByText('Form Validation Sandbox (RHF + Zod)'),
    ).toBeNull();

    // Click on 'Forms & Validation' tab
    const formsTab = screen.getByText('Forms & Validation');
    fireEvent.click(formsTab);

    // Verify form sandbox renders and basic buttons are hidden
    expect(screen.queryByText('Buttons')).toBeNull();
    expect(
      screen.getByText('Form Validation Sandbox (RHF + Zod)'),
    ).toBeTruthy();

    // Click on 'Overlays & Feedback' tab
    const feedbackTab = screen.getByText('Overlays & Feedback');
    fireEvent.click(feedbackTab);

    // Verify overlays section is shown
    expect(screen.getByText('Dialogs & Overlays')).toBeTruthy();
  });
});
