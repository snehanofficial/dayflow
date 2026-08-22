import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from './toastStore.js';
import { toast as sonnerToast } from 'sonner';

// Mock sonner module
vi.mock('sonner', () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('toast abstraction wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call sonnerToast.success with message and id key', () => {
    toast.success('Operation succeeded!');
    expect(sonnerToast.success).toHaveBeenCalledWith(
      'Operation succeeded!',
      expect.objectContaining({
        id: 'success:Operation succeeded!',
        duration: 5000,
      }),
    );
  });

  it('should call sonnerToast.error with message and id key', () => {
    toast.error('Operation failed!');
    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Operation failed!',
      expect.objectContaining({
        id: 'error:Operation failed!',
        duration: 5000,
      }),
    );
  });

  it('should call sonnerToast.info with message and id key', () => {
    toast.info('Info notification');
    expect(sonnerToast.info).toHaveBeenCalledWith(
      'Info notification',
      expect.objectContaining({
        id: 'info:Info notification',
        duration: 5000,
      }),
    );
  });

  it('should call sonnerToast.warning with message and id key', () => {
    toast.warning('Warning message');
    expect(sonnerToast.warning).toHaveBeenCalledWith(
      'Warning message',
      expect.objectContaining({
        id: 'warning:Warning message',
        duration: 5000,
      }),
    );
  });
});
