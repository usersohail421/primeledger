import Modal from './Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmModalProps) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-muted-foreground mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:border-primary transition-colors duration-200"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmModal;
