import { joiResolver } from '@hookform/resolvers/joi';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PasswordField, TextField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ApiError, toErrorMessage } from '../../services/api/ApiError';
import { registerSchema } from '../../validations/auth.validation';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: joiResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setServerError(null);
    try {
      await registerUser({ name, email, password });
      toast.success('Account created. Welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('email', { message: err.message });
      else setServerError(toErrorMessage(err));
    }
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">New accounts are created with employee access.</p>

      {serverError && (
        <div role="alert" className="mb-4 border-l-4 border-accent-600 bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Full name" icon="user" autoComplete="name" placeholder="Jane Doe" error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" icon="mail" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" icon="lock" autoComplete="new-password" hint="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirm password" icon="lock" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" className="h-11 w-full text-base" loading={isSubmitting} loadingText="Creating account...">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-sky-700 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
