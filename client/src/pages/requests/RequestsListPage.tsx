import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { NewRequestButton } from '../../components/requests/NewRequestButton';
import { RequestFilters } from '../../components/requests/RequestFilters';
import { RequestTable } from '../../components/requests/RequestTable';
import { RequestTableSkeleton } from '../../components/requests/RequestTableSkeleton';
import { Button } from '../../components/ui/Button';
import { TopProgress } from '../../components/ui/TopProgress';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PAGE_SIZE, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../constants/requests';
import { useRequestActions } from '../../hooks/useRequestActions';
import { useRequests } from '../../hooks/useRequests';
import type { RequestPriority, RequestStatus, ServiceRequest } from '../../types/request';

const STATUSES = STATUS_OPTIONS.map((o) => o.value);
const PRIORITIES = PRIORITY_OPTIONS.map((o) => o.value);

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value);
}

export function RequestsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = oneOf<RequestStatus>(searchParams.get('status'), STATUSES);
  const priority = oneOf<RequestPriority>(searchParams.get('priority'), PRIORITIES);
  const overdue = searchParams.get('overdue') === 'true';
  const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1);

  const { data, error, isLoading, isFetching, reload } = useRequests({ status, priority, overdue, page, limit: PAGE_SIZE });
  const { remove, pending } = useRequestActions();
  const [toDelete, setToDelete] = useState<ServiceRequest | null>(null);

  const updateParams = useCallback(
    (next: { status?: RequestStatus; priority?: RequestPriority; overdue?: boolean; page?: number }, merge = true) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(merge ? prev : undefined);
          for (const [key, value] of Object.entries(next)) {
            if (value === undefined || value === false || (value === 1 && key === 'page')) params.delete(key);
            else params.set(key, String(value));
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) updateParams({ page: Math.max(1, data.pagination.totalPages) });
  }, [data, page, updateParams]);

  const handleDelete = async () => {
    if (!toDelete) return;
    const result = await remove(toDelete.id);
    if (!result.error) {
      setToDelete(null);
      reload();
    }
  };

  const filtersActive = !!(status || priority || overdue);

  return (
    <>
      <PageHeader
        title="Service requests"
        subtitle="Browse, filter and manage requests."
        actions={<NewRequestButton />}
      />

      <Card>
        <RequestFilters
          status={status}
          priority={priority}
          overdue={overdue}
          onStatusChange={(s) => updateParams({ status: s, page: 1 })}
          onPriorityChange={(p) => updateParams({ priority: p, page: 1 })}
          onOverdueChange={(o) => updateParams({ overdue: o, page: 1 })}
          onClear={() => updateParams({}, false)}
        />

        <TopProgress active={isFetching && !isLoading} />

        {isLoading && <RequestTableSkeleton />}

        {error && <ErrorState title="Unable to load service requests." message={error.message} onRetry={reload} />}

        {data && !error && data.items.length === 0 && page === 1 && (
          filtersActive ? (
            <EmptyState
              title="No requests match your filters."
              description="Try a different status, priority or overdue setting."
              action={
                <Button variant="secondary" onClick={() => updateParams({}, false)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No service requests found."
              description="Create your first service request."
              action={<ButtonLink to="/requests/new">Create Request</ButtonLink>}
            />
          )
        )}

        {data && !error && data.items.length > 0 && (
          <>
            <RequestTable items={data.items} onDelete={setToDelete} isFetching={isFetching} />
            <Pagination pagination={data.pagination} onPageChange={(p) => updateParams({ page: p })} disabled={isFetching} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this request?"
        description={toDelete ? `“${toDelete.title}” will be permanently deleted. This can't be undone.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={pending === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
