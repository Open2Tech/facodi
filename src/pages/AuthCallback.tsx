import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthLink } from '@/features/auth/useAuthLink';
import { safeReturnPath } from '@/shared/lib/navigation';
import { PageState } from '@/components/layout/PageState';

export default function AuthCallback() {
  const { t } = useTranslation();
  const { state, next } = useAuthLink(true);
  if (state === 'pending') return <PageState loading />;
  if (state === 'invalid') return <><PageState title={t('auth.error.invalidLink')} description={t('auth.invalidLinkDescription')} /><Link className="underline" to="/login">{t('auth.login')}</Link></>;
  return <Navigate to={safeReturnPath(next)} replace />;
}
