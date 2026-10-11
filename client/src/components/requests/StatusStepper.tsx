import { STATUS_OPTIONS } from '../../constants/requests';
import type { RequestStatus } from '../../types/request';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

export function StatusStepper({ status }: { status: RequestStatus }) {
  const current = STATUS_OPTIONS.findIndex((s) => s.value === status);

  return (
    <ol className="flex items-center" aria-label="Request progress">
      {STATUS_OPTIONS.map((step, i) => {
        const done = i < current || status === 'RESOLVED';
        const active = i === current && status !== 'RESOLVED';
        return (
          <li key={step.value} className={cn('flex items-center', i < STATUS_OPTIONS.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  done && 'bg-green-600 text-white',
                  active && 'bg-sky-300 text-sky-950 ring-4 ring-sky-100',
                  !done && !active && 'bg-gray-100 text-gray-400',
                )}
              >
                {done ? <Icon name="check" className="h-4 w-4 stroke-2" /> : i + 1}
              </span>
              <span className={cn('hidden text-sm font-medium sm:inline', done || active ? 'text-gray-900' : 'text-gray-400')}>{step.label}</span>
            </div>
            {i < STATUS_OPTIONS.length - 1 && <span className={cn('mx-3 h-0.5 flex-1 rounded', i < current || status === 'RESOLVED' ? 'bg-green-600' : 'bg-gray-200')} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
