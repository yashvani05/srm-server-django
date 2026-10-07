import type { RequestStatus } from '../../types/request';
import { STATUS_OPTIONS } from '../../constants/requests';
import { Badge, type BadgeTone } from '../ui/Badge';

const tones: Record<RequestStatus, BadgeTone> = { OPEN: 'blue', IN_PROGRESS: 'amber', RESOLVED: 'green' };
const labels = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])) as Record<RequestStatus, string>;

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
