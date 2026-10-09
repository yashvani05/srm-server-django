import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { RequestDetailsSkeleton } from '../../components/requests/RequestDetailsSkeleton';
import { RequestForm } from '../../components/requests/RequestForm';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useRequest } from '../../hooks/useRequest';
import { useRequestActions } from '../../hooks/useRequestActions';
import type { RequestFormValues } from '../../types/request';
import { canEditRequest } from '../../utils/permissions';

export function RequestEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: request, error, isLoading, reload } = useRequest(id);
  const { update, pending } = useRequestActions();

  const handleSubmit = async (values: RequestFormValues) => {
    const result = await update(id, values);
    if (result.data) navigate('/requests');
    return result;
  };

  if (isLoading) return <RequestDetailsSkeleton />;

  if (error) {
    return error.isNotFound ? (
      <Card>
        <EmptyState title="Request not found." description="It may have been deleted." action={<ButtonLink to="/requests">Back to requests</ButtonLink>} />
      </Card>
    ) : (
      <Card>
        <ErrorState title="Unable to load this request." message={error.message} onRetry={reload} />
      </Card>
    );
  }

  if (request && !canEditRequest(user, request)) {
    return (
      <Card>
        <EmptyState
          title="This request can't be edited."
          description="Employees can only edit their own requests while they are open."
          action={<ButtonLink to={`/requests/${id}`}>Back to request</ButtonLink>}
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit service request" />
      <Card className="p-5">
        {request && (
          <RequestForm
            key={request.id}
            defaultValues={{ title: request.title, description: request.description, category: request.category, priority: request.priority }}
            submitLabel="Save changes"
            loadingLabel="Saving..."
            isSubmitting={pending === 'update'}
            cancelTo={`/requests/${id}`}
            onSubmit={handleSubmit}
          />
        )}
      </Card>
    </div>
  );
}
