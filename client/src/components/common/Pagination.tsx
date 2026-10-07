import type { Pagination as PaginationMeta } from '../../types/api';
import { Button } from '../ui/Button';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ pagination, onPageChange, disabled }: PaginationProps) {
  const { page, limit, totalItems, totalPages } = pagination;
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-gray-600" aria-live="polite">
        Showing <span className="font-medium text-gray-900">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-900">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages}>
          Next
        </Button>
      </div>
    </nav>
  );
}
