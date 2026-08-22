import { Dialog } from './Dialog.js';
import { Button } from './Button.js';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      closeOnOverlayClick={!isDanger} // Disallow click outside for dangerous actions
    >
      <p className="dialog-message">{message}</p>
      <div className="dialog-actions">
        <Button onClick={onCancel} variant="secondary">
          {cancelLabel}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onCancel(); // Close dialog after confirming
          }}
          variant={isDanger ? 'danger' : 'primary'}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
export default ConfirmDialog;
