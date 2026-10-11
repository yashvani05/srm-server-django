import type { DashboardSummary } from '../../types/dashboard';
import { Card } from '../ui/Card';

const SEGMENTS = [
  { key: 'openRequests', label: 'Open', bar: 'bg-blue-500' },
  { key: 'inProgressRequests', label: 'In Progress', bar: 'bg-amber-500' },
  { key: 'resolvedRequests', label: 'Resolved', bar: 'bg-green-600' },
] as const;

export function StatusBreakdown({ summary }: { summary: DashboardSummary }) {
  const total = summary.totalRequests;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <Card className="mt-4 p-5">
      <h2 className="text-sm font-semibold text-gray-900">Status breakdown</h2>
      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label={SEGMENTS.map((s) => `${s.label} ${summary[s.key]}`).join(', ')}
      >
        {SEGMENTS.map((s) => (
          <div key={s.key} className={`${s.bar} transition-all`} style={{ width: `${(summary[s.key] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} aria-hidden="true" />
            <span className="text-gray-600">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums text-gray-900">
              {summary[s.key]} <span className="font-normal text-gray-400">({pct(summary[s.key])}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
