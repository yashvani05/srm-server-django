import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../constants/requests';
import { useGoBack } from '../../hooks/useGoBack';
import type { ActionResult } from '../../hooks/useRequestActions';
import { ApiError } from '../../services/api/ApiError';
import type { RequestFormValues } from '../../types/request';
import { requestFormSchema } from '../../validations/request.validation';
import { Button } from '../ui/Button';
import { TextareaField, TextField } from '../ui/FormField';
import { SegmentedRadio } from '../ui/SegmentedRadio';

const FORM_FIELDS: (keyof RequestFormValues)[] = ['title', 'description', 'category', 'priority'];
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;

interface RequestFormProps {
  defaultValues?: Partial<RequestFormValues>;
  submitLabel: string;
  loadingLabel: string;
  isSubmitting: boolean;
  cancelTo: string;
  onSubmit: (values: RequestFormValues) => Promise<ActionResult<unknown>>;
}

export function RequestForm({ defaultValues, submitLabel, loadingLabel, isSubmitting, cancelTo, onSubmit }: RequestFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: joiResolver(requestFormSchema),
    mode: 'onTouched',
    defaultValues: { title: '', description: '', category: undefined, priority: 'MEDIUM', ...defaultValues },
  });

  const goBack = useGoBack(cancelTo);
  const titleLength = watch('title')?.length ?? 0;
  const descriptionLength = watch('description')?.length ?? 0;

  const submit = handleSubmit(async (values) => {
    const result = await onSubmit(values);
    if (result.error instanceof ApiError) {
      result.error.errors.forEach((e) => {
        if (e.field && FORM_FIELDS.includes(e.field as keyof RequestFormValues)) {
          setError(e.field as keyof RequestFormValues, { message: e.message });
        }
      });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <TextField
        label="Title"
        placeholder="Short summary of the issue"
        maxLength={TITLE_MAX}
        counter={`${titleLength}/${TITLE_MAX}`}
        error={errors.title?.message}
        {...register('title')}
      />
      <TextareaField
        label="Description"
        rows={6}
        placeholder="What do you need? Include any details that will help us act quickly."
        maxLength={DESCRIPTION_MAX}
        counter={`${descriptionLength}/${DESCRIPTION_MAX}`}
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <SegmentedRadio label="Category" options={CATEGORY_OPTIONS} error={errors.category?.message} {...register('category')} />
        <SegmentedRadio label="Priority" options={PRIORITY_OPTIONS} error={errors.priority?.message} {...register('priority')} />
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={goBack} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} loadingText={loadingLabel}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
