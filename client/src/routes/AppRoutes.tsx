import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RequestCreatePage } from '../pages/requests/RequestCreatePage';
import { RequestDetailsPage } from '../pages/requests/RequestDetailsPage';
import { RequestEditPage } from '../pages/requests/RequestEditPage';
import { RequestsListPage } from '../pages/requests/RequestsListPage';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsListPage />} />
          <Route path="/requests/new" element={<RequestCreatePage />} />
          <Route path="/requests/:id" element={<RequestDetailsPage />} />
          <Route path="/requests/:id/edit" element={<RequestEditPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
