import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../constants/requests';
import type { RequestPriority, RequestStatus } from '../../types/request';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { FilterTabs } from '../ui/FilterTabs';
import { Icon } from '../ui/Icon';

interface RequestFiltersProps {
  status?: RequestStatus;
  priority?: RequestPriority;
  overdue: boolean;
  onStatusChange: (status?: RequestStatus) => void;
  onPriorityChange: (priority?: RequestPriority) => void;
  onOverdueChange: (overdue: boolean) => void;
  onClear: () => void;
}

const STATUS_TABS = [{ value: undefined, label: 'All' }, ...STATUS_OPTIONS];
const PRIORITY_TABS = [{ value: undefined, label: 'Any' }, ...PRIORITY_OPTIONS];

export function RequestFilters({ status, priority, overdue, onStatusChange, onPriorityChange, onOverdueChange, onClear }: RequestFiltersProps) {
  const active = !!(status || priority || overdue);

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs label="Filter by status" options={STATUS_TABS} value={status} onChange={onStatusChange} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Priority</span>
          <FilterTabs label="Filter by priority" options={PRIORITY_TABS} value={priority} onChange={onPriorityChange} />
          <button
            type="button"
            aria-pressed={overdue}
            onClick={() => onOverdueChange(!overdue)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              overdue ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            )}
          >
            <Icon name="clock" className="h-4 w-4" /> Overdue
          </button>
        </div>
      </div>
      {active && (
        <div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
