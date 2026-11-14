import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const name = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : user?.email;
  const links = [
    { to: '/courses', title: t('nav.courses'), description: t('dashboard.catalog') },
    { to: '/profile', title: t('nav.profile'), description: t('dashboard.account') },
    ...(canAccessFacodiRoute(role, 'editor') ? [{ to: '/editor', title: t('nav.editor'), description: t('dashboard.editor') }] : []),
    ...(role === 'admin' ? [{ to: '/admin', title: t('nav.admin'), description: t('dashboard.admin') }] : []),
  ];
  return <>
    <h1 className="text-4xl font-semibold">{t('dashboard.welcome', { name })}</h1>
    <p className="mt-4 text-muted-foreground">{t('dashboard.description')}</p>
    <dl className="my-8 flex flex-wrap gap-x-12 gap-y-4 border-y border-input py-6 text-sm">
      <div><dt className="text-muted-foreground">{t('auth.email')}</dt><dd className="mt-1 break-all font-medium">{user?.email}</dd></div>
      <div><dt className="text-muted-foreground">{t('dashboard.role')}</dt><dd className="mt-1 font-medium">{t(`roles.${role}`)}</dd></div>
    </dl>
    <div className="divide-y divide-input">{links.map(link => <Link key={link.to} to={link.to} className="flex items-center justify-between gap-4 py-6 transition-colors hover:bg-muted/50"><div><h2 className="text-xl font-semibold">{link.title}</h2><p className="mt-2 text-muted-foreground">{link.description}</p></div><ArrowUpRight className="shrink-0" /></Link>)}</div>
  </>;
}
