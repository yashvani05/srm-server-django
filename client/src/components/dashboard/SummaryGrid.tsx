import { OVERDUE_AFTER_HOURS } from '../../constants/requests';
import type { DashboardSummary } from '../../types/dashboard';
import { timeAgo } from '../../utils/time';
import { SummaryCard } from './SummaryCard';

export function SummaryGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard label="Total Requests" value={summary.totalRequests} caption="All service requests" icon="stack" to="/requests" />
      <SummaryCard label="Open Requests" value={summary.openRequests} caption="Waiting to be picked up" icon="inbox" to="/requests?status=OPEN" />
      <SummaryCard label="In-Progress Requests" value={summary.inProgressRequests} caption="Currently being worked on" icon="progress" to="/requests?status=IN_PROGRESS" />
      <SummaryCard label="Resolved Requests" value={summary.resolvedRequests} caption="Completed" icon="check" to="/requests?status=RESOLVED" />
      <SummaryCard label="High-Priority Requests" value={summary.highPriorityRequests} caption="Any status" icon="bolt" emphasis to="/requests?priority=HIGH" />
      <SummaryCard
        label="Overdue Requests"
        value={summary.overdueRequests}
        caption={`Over ${OVERDUE_AFTER_HOURS}h open / in progress · ${summary.lastOverdueCheckAt ? `checked ${timeAgo(summary.lastOverdueCheckAt)}` : 'worker has not run yet'}`}
        icon="clock"
        emphasis
        to="/requests?overdue=true"
      />
    </div>
  );
}
