import { Link } from 'react-router-dom';

export function Brand({ to = '/dashboard' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-[2px] bg-white" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-gray-900">Service Requests</span>
    </Link>
  );
}
