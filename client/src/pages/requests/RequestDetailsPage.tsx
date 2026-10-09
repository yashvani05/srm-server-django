import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { OverdueBadge } from '../../components/requests/OverdueBadge';
import { PriorityBadge } from '../../components/requests/PriorityBadge';
import { RequestDetailsSkeleton } from '../../components/requests/RequestDetailsSkeleton';
import { StatusActions } from '../../components/requests/StatusActions';
import { StatusBadge } from '../../components/requests/StatusBadge';
import { StatusStepper } from '../../components/requests/StatusStepper';
import { ActionMenu } from '../../components/ui/ActionMenu';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Icon } from '../../components/ui/Icon';
import { CATEGORY_LABELS, OVERDUE_AFTER_HOURS, STATUS_OPTIONS } from '../../constants/requests';
import { useAuth } from '../../hooks/useAuth';
import { useRequest } from '../../hooks/useRequest';
import { useRequestActions } from '../../hooks/useRequestActions';
import type { RequestStatus } from '../../types/request';
import { formatDateTime } from '../../utils/format';
import { canEditRequest } from '../../utils/permissions';
import { elapsed, timeAgo } from '../../utils/time';

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export function RequestDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { data: request, error, isLoading, reload, setData } = useRequest(id);
  const { remove, changeStatus, pending } = useRequestActions();
  const [updatingTo, setUpdatingTo] = useState<RequestStatus | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleStatusChange = async (status: RequestStatus) => {
    setUpdatingTo(status);
    const result = await changeStatus(id, status);
    setUpdatingTo(null);
    if (result.data) setData(result.data);
  };

  const handleDelete = async () => {
    const result = await remove(id);
    if (!result.error) navigate('/requests', { replace: true });
  };

  if (isLoading) return <RequestDetailsSkeleton />;

  if (error) {
    return (
      <Card>
        {error.isNotFound ? (
          <EmptyState title="Request not found." description="It may have been deleted, or you may not have access to it." action={<ButtonLink to="/requests">Back to requests</ButtonLink>} />
        ) : (
          <ErrorState title="Unable to load this request." message={error.message} onRetry={reload} />
        )}
      </Card>
    );
  }
  if (!request) return null;

  const canEdit = canEditRequest(user, request);
  const canDelete = hasPermission('requests.delete');
  const canChangeStatus = hasPermission('requests.status.update');
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === request.status)!.label;

  return (
    <>
      <Link to="/requests" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <Icon name="back" className="h-4 w-4" /> All requests
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {request.isOverdue && <OverdueBadge />}
            <PriorityBadge priority={request.priority} />
          </div>
          <h1 className="break-words text-xl font-semibold text-gray-900">{request.title}</h1>
        </div>
        <div className="shrink-0">
          <ActionMenu
            label={`Actions for ${request.title}`}
            items={[
              ...(canEdit ? [{ label: 'Edit', icon: 'pencil' as const, onSelect: () => navigate(`/requests/${request.id}/edit`) }] : []),
              ...(canDelete ? [{ label: 'Delete', icon: 'trash' as const, danger: true, onSelect: () => setConfirmingDelete(true) }] : []),
            ]}
          />
        </div>
      </div>

      {request.isOverdue && (
        <div role="alert" className="mb-6 flex items-start gap-3 border-l-4 border-accent-600 bg-accent-50 px-4 py-3 text-sm text-accent-700">
          <Icon name="warning" className="mt-0.5 h-5 w-5 text-accent-600" />
          <p>
            <strong className="font-semibold">Overdue.</strong> This request has been <strong>{statusLabel}</strong> for {elapsed(request.statusChangedAt)}, beyond the {OVERDUE_AFTER_HOURS}-hour limit.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <StatusStepper status={request.status} />
          </Card>

          <Card className="p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Description</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{request.description}</p>
          </Card>

          {canChangeStatus && (
            <Card className="p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Update status</h2>
              <StatusActions current={request.status} updatingTo={updatingTo} onChange={handleStatusChange} />
            </Card>
          )}
        </div>

        <Card className="h-fit px-5 py-2">
          <h2 className="sr-only">Details</h2>
          <dl className="divide-y divide-gray-100">
            <Meta label="Requested by">{request.createdBy.name}</Meta>
            <Meta label="Category">{CATEGORY_LABELS[request.category]}</Meta>
            <Meta label="Created">
              <span title={formatDateTime(request.createdAt)}>{timeAgo(request.createdAt)}</span>
            </Meta>
            <Meta label="Last updated">
              <span title={formatDateTime(request.updatedAt)}>{timeAgo(request.updatedAt)}</span>
            </Meta>
            {request.status !== 'RESOLVED' && <Meta label={`Time ${statusLabel.toLowerCase()}`}>{elapsed(request.statusChangedAt)}</Meta>}
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this request?"
        description={`“${request.title}” will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={pending === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
