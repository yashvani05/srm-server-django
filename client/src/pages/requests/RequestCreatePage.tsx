import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { RequestForm } from '../../components/requests/RequestForm';
import { Card } from '../../components/ui/Card';
import { useRequestActions } from '../../hooks/useRequestActions';
import type { RequestFormValues } from '../../types/request';

export function RequestCreatePage() {
  const navigate = useNavigate();
  const { create, pending } = useRequestActions();

  const handleSubmit = async (values: RequestFormValues) => {
    const result = await create(values);
    if (result.data) navigate('/requests');
    return result;
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New service request" subtitle="Tell us what you need and we'll track it for you." />
      <Card className="p-5">
        <RequestForm
          submitLabel="Create request"
          loadingLabel="Saving..."
          isSubmitting={pending === 'create'}
          cancelTo="/requests"
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
