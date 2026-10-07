import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { StatusBreakdown } from '../../components/dashboard/StatusBreakdown';
import { SummaryGrid } from '../../components/dashboard/SummaryGrid';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Card } from '../../components/ui/Card';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';

export function DashboardPage() {
  const { data, error, isLoading, reload } = useDashboardSummary();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A live summary of all service requests." />

      {isLoading && <DashboardSkeleton />}

      {error && (
        <Card>
          <ErrorState title="Unable to load the dashboard." message={error.message} onRetry={reload} />
        </Card>
      )}

      {data && !error && data.totalRequests === 0 && (
        <Card>
          <EmptyState
            title="No service requests yet."
            description="Summary figures will appear here once requests are created."
            action={<ButtonLink to="/requests/new">Create Request</ButtonLink>}
          />
        </Card>
      )}

      {data && !error && data.totalRequests > 0 && (
        <>
          <SummaryGrid summary={data} />
          <StatusBreakdown summary={data} />
        </>
      )}
    </>
  );
}
