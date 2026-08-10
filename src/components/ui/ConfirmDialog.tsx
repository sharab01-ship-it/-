import { useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Alert } from './Alert';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'error';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'default',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{message}</p>
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-text" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          onClick={handleConfirm}
          className={variant === 'error' ? 'btn-error' : 'btn-filled'}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  maxWidth = 'md',
}: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth={maxWidth}>
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      <div className="space-y-4">{children}</div>
      <div className="flex gap-3 justify-end mt-6">
        <button onClick={onClose} className="btn-text" disabled={loading}>
          {cancelLabel}
        </button>
        <button onClick={handleSubmit} className="btn-filled" disabled={loading}>
          {loading ? <Spinner size="sm" /> : submitLabel}
        </button>
      </div>
    </Dialog>
  );
}
