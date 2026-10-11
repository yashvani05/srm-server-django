import type { FieldError } from '../../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export function toErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof ApiError ? err.message : fallback;
}
