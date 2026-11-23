import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthLink } from '@/features/auth/useAuthLink';
import { safeReturnPath } from '@/shared/lib/navigation';
import { PageState } from '@/components/layout/PageState';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const { t } = useTranslation();
  const { state, errorKey, next } = useAuthLink(true);
  if (state === 'pending') return <PageState loading />;
  if (state === 'invalid') return <AuthShell>
    <div className="[&>section]:mt-0"><PageState title={t(errorKey)} description={t(errorKey.startsWith('auth.error.oauth') ? 'auth.oauthRetryDescription' : 'auth.invalidLinkDescription')} /></div>
    <div className="flex flex-wrap gap-3">
      <Button asChild><Link to={`/login?next=${encodeURIComponent(safeReturnPath(next))}`}>{t('auth.login')}</Link></Button>
      <Button variant="outline" asChild><Link to="/auth/reset-password">{t('auth.forgot')}</Link></Button>
    </div>
  </AuthShell>;
  return <Navigate to={safeReturnPath(next)} replace />;
}
