import type { RequestPriority } from '../../types/request';
import { PRIORITY_OPTIONS } from '../../constants/requests';
import { Badge, type BadgeTone } from '../ui/Badge';

const tones: Record<RequestPriority, BadgeTone> = { LOW: 'neutral', MEDIUM: 'outline', HIGH: 'red' };
const labels = Object.fromEntries(PRIORITY_OPTIONS.map((o) => [o.value, o.label])) as Record<RequestPriority, string>;

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <Badge tone={tones[priority]} dot={false}>
      {labels[priority]}
    </Badge>
  );
}
