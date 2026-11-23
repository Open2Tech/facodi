import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { PageState } from '@/components/layout/PageState';

export default function ProtectedRoute({ required }: { required?: 'editor' | 'admin' }) {
  const { loading, user, role } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (loading) return <PageState loading />;
  if (!user) return <Navigate replace state={location.state} to={`/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} />;
  if (required && !canAccessFacodiRoute(role, required)) {
    return <PageState title={t('access.denied')} description={t('access.description')} />;
  }
  return <Outlet />;
}
