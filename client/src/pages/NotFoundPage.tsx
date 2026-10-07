import { Brand } from '../components/layout/Brand';
import { ButtonLink } from '../components/ui/ButtonLink';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <Brand />
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
      <ButtonLink to="/dashboard" className="mt-6">Go to dashboard</ButtonLink>
    </main>
  );
}
