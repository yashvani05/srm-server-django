import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Brand } from './Brand';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/requests', label: 'Requests', icon: 'list' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Brand />
      </div>

      <nav aria-label="Main" className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded bg-accent-600" aria-hidden="true" />}
                <Icon name={item.icon} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800" aria-hidden="true">
            {user ? initials(user.name) : ''}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">{user?.role}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout} loading={signingOut} loadingText="Signing out...">
          <Icon name="logout" className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
