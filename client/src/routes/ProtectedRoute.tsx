import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShellSkeleton } from '../components/layout/AppShellSkeleton';
import { useAuth } from '../hooks/useAuth';

/** Renders child routes only for signed-in users; remembers where they were headed. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppShellSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Keeps signed-in users away from the login / register screens. */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
