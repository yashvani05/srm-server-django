import { NavLink, Outlet } from 'react-router-dom';
import { AuthPreview } from '../components/layout/AuthPreview';
import { Brand } from '../components/layout/Brand';
import { Icon, type IconName } from '../components/ui/Icon';
import { cn } from '../utils/cn';

const POINTS: { icon: IconName; title: string; text: string; tone: string }[] = [
  { icon: 'plus', title: 'Submit in seconds', text: 'IT, maintenance and general requests in one place.', tone: 'bg-sky-100 text-sky-700' },
  { icon: 'progress', title: 'Follow every step', text: 'Watch each request move from open to resolved.', tone: 'bg-emerald-100 text-emerald-700' },
  { icon: 'clock', title: 'Nothing slips', text: 'Requests are flagged automatically after 24 hours.', tone: 'bg-amber-100 text-amber-700' },
];

const HEADLINE = 'Every request, tracked from submission to resolution.';

function AuthTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
      isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    );
  return (
    <nav aria-label="Account" className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
      <NavLink to="/login" className={tab}>
        Sign in
      </NavLink>
      <NavLink to="/register" className={tab}>
        Create account
      </NavLink>
    </nav>
  );
}

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <aside className="auth-banner relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Brand to="/login" />
        <div className="mx-auto w-full max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-sky-800">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Internal service desk
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900">{HEADLINE}</h2>
          <p className="mt-4 text-base text-slate-600">One simple place for employees to ask for help and for the team to keep track of it.</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-center gap-4">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', p.tone)}>
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                  <p className="text-sm text-slate-600">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <AuthPreview />
          <p className="text-center text-xs text-slate-500">Internal use only</p>
        </div>
      </aside>

      <main className="flex flex-col items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="auth-banner mb-6 w-full max-w-md rounded-2xl border border-white p-5 shadow-sm lg:hidden">
          <Brand to="/login" />
          <h2 className="mt-4 text-xl font-semibold leading-snug text-slate-900">{HEADLINE}</h2>
          <p className="mt-1 text-sm text-slate-600">Submit requests and follow them to resolution.</p>
        </div>

        <div className="w-full max-w-md animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <AuthTabs />
          <Outlet />
        </div>
        <p className="mt-6 max-w-md text-center text-xs text-slate-500">By continuing you agree to use this system for company business only.</p>
      </main>
    </div>
  );
}
