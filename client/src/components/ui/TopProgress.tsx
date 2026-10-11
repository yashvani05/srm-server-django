export function TopProgress({ active }: { active: boolean }) {
  return (
    <div className="h-0.5 overflow-hidden" role={active ? 'progressbar' : undefined} aria-label={active ? 'Updating results' : undefined}>
      {active && <div className="h-full w-1/4 animate-progress bg-accent-600" />}
    </div>
  );
}
