import type { RequestStatus } from '../../types/request';
import { Button } from '../ui/Button';

interface Action {
  to: RequestStatus;
  label: string;
  variant: 'primary' | 'secondary';
}

const ACTIONS: Record<RequestStatus, Action[]> = {
  OPEN: [
    { to: 'IN_PROGRESS', label: 'Start progress', variant: 'primary' },
    { to: 'RESOLVED', label: 'Mark resolved', variant: 'secondary' },
  ],
  IN_PROGRESS: [
    { to: 'RESOLVED', label: 'Mark resolved', variant: 'primary' },
    { to: 'OPEN', label: 'Move back to open', variant: 'secondary' },
  ],
  RESOLVED: [{ to: 'OPEN', label: 'Reopen', variant: 'secondary' }],
};

interface StatusActionsProps {
  current: RequestStatus;
  updatingTo: RequestStatus | null;
  onChange: (status: RequestStatus) => void;
}

export function StatusActions({ current, updatingTo, onChange }: StatusActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS[current].map((a) => (
        <Button key={a.to} variant={a.variant} onClick={() => onChange(a.to)} loading={updatingTo === a.to} loadingText="Updating..." disabled={updatingTo !== null}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}
