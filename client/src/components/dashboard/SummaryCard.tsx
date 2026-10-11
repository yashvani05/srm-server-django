import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Icon, type IconName } from '../ui/Icon';

interface SummaryCardProps {
  label: string;
  value: number;
  caption: string;
  icon: IconName;
  emphasis?: boolean;
  to?: string;
}

export function SummaryCard({ label, value, caption, icon, emphasis = false, to }: SummaryCardProps) {
  const alert = emphasis && value > 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded', alert ? 'bg-accent-50 text-accent-600' : 'bg-gray-100 text-gray-500')}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tabular-nums', alert ? 'text-accent-600' : 'text-gray-900')}>{value.toLocaleString()}</p>
      <p className="mt-1 flex items-center justify-between text-xs text-gray-500">
        {caption}
        {to && <Icon name="chevron" className="h-3.5 w-3.5 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-600" />}
      </p>
    </>
  );
  const classes = cn(
    'group block rounded-md border bg-white p-4',
    emphasis ? 'border-gray-200 border-l-4 border-l-accent-600' : 'border-gray-200',
    to && 'transition-all hover:-translate-y-px hover:border-gray-400 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
  );

  return to ? (
    <Link to={to} className={classes} aria-label={`${label}: ${value}. View requests`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
