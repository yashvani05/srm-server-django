import { cn } from '../../utils/cn';

const STATS = [
  { label: 'Open', value: 7, tone: 'bg-sky-50 text-sky-700', dot: 'bg-sky-400' },
  { label: 'In progress', value: 3, tone: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  { label: 'Resolved', value: 3, tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
];

export function AuthPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="animate-float rounded-2xl border border-white bg-white/85 p-4 shadow-xl shadow-sky-200/60 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</span>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">5 overdue</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((s) => (
            <div key={s.label} className={cn('rounded-xl p-3', s.tone)}>
              <div className="flex items-center gap-1.5 text-[11px] font-medium">
                <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                {s.label}
              </div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
          <span className="bg-sky-300" style={{ width: '54%' }} />
          <span className="bg-amber-300" style={{ width: '23%' }} />
          <span className="bg-emerald-300" style={{ width: '23%' }} />
        </div>
        <div className="mt-4 space-y-2">
          {[
            { t: 'Wi-Fi drops in the north corridor', c: 'bg-rose-100 text-rose-700', l: 'Overdue' },
            { t: 'Request access to the finance drive', c: 'bg-sky-100 text-sky-700', l: 'Open' },
          ].map((r) => (
            <div key={r.t} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2">
              <span className="truncate pr-3 text-xs text-slate-700">{r.t}</span>
              <span className={cn('shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase', r.c)}>{r.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
