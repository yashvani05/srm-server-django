import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, loadingLabel, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      onCancel={(e) => {
        e.preventDefault();
        if (!loading) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-gray-200 p-0 shadow-xl backdrop:bg-gray-900/50"
    >
      <div className="p-5">
        <h2 id="confirm-title" className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-sm text-gray-600">
          {description}
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} loadingText={loadingLabel}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
