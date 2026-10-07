import { joiResolver } from '@hookform/resolvers/joi';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PasswordField, TextField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { toErrorMessage } from '../../services/api/ApiError';
import type { LoginPayload } from '../../types/auth';
import { loginSchema } from '../../validations/auth.validation';

const DEMO_ACCOUNTS = [
  { label: 'admin', email: 'admin@company.com', password: 'Admin@12345' },
  { label: 'employee', email: 'employee@company.com', password: 'Employee@12345' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({ resolver: joiResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(toErrorMessage(err));
    }
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Sign in with your company account to continue.</p>

      {serverError && (
        <div role="alert" className="mb-4 border-l-4 border-accent-600 bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Email" type="email" icon="mail" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" icon="lock" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="h-11 w-full text-base" loading={isSubmitting} loadingText="Signing in...">
          Sign in
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Quick fill for demos (development only)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  setValue('email', a.email, { shouldValidate: true });
                  setValue('password', a.password, { shouldValidate: true });
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                Fill {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-sky-700 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
