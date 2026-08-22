import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * HackCore thin toast abstraction wrapping Sonner.
 * Prevents direct dependency on Sonner throughout the application code.
 * Automatically deduplicates identical messages using stable ID values.
 */
export const toast = {
  success(message: string, duration = 5000) {
    return sonnerToast.success(message, {
      id: `success:${message}`,
      duration,
    });
  },

  error(message: string, duration = 5000) {
    return sonnerToast.error(message, {
      id: `error:${message}`,
      duration,
    });
  },

  info(message: string, duration = 5000) {
    return sonnerToast.info(message, {
      id: `info:${message}`,
      duration,
    });
  },

  warning(message: string, duration = 5000) {
    return sonnerToast.warning(message, {
      id: `warning:${message}`,
      duration,
    });
  },
};
