import { Toaster } from 'sonner';

export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'toast-item',
          success: 'toast-success',
          error: 'toast-error',
          warning: 'toast-warning',
          info: 'toast-info',
        },
      }}
    />
  );
}
