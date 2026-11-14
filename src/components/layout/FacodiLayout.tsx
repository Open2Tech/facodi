import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { cn } from '@/lib/utils';

export default function FacodiLayout() {
  const { t, i18n } = useTranslation();
  const { user, role, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const privateRoute = ['/dashboard', '/profile', '/editor', '/admin', '/login', '/auth'].some(path => location.pathname.startsWith(path));
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => { document.documentElement.lang = i18n.language; }, [i18n.language]);
  async function logout() {
    setSigningOut(true);
    try { await signOut(); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('common.error')); }
    finally { setSigningOut(false); }
  }
  const links = [
    { to: '/courses', title: t('nav.courses') },
    { to: '/units', title: t('nav.units') },
    { to: '/resources', title: t('nav.resources') },
    { to: '/about', title: t('nav.about') },
    ...(user ? [{ to: '/dashboard', title: t('nav.dashboard') }] : []),
    ...(canAccessFacodiRoute(role, 'editor') ? [{ to: '/editor', title: t('nav.editor') }] : []),
    ...(role === 'admin' ? [{ to: '/admin', title: t('nav.admin') }] : []),
  ];
  const footer = [
    { title: t('footer.learn'), links: [{ to: '/courses', title: t('content.courses') }, { to: '/units', title: t('content.curricular_units') }, { to: '/resources', title: t('nav.resources') }] },
    { title: t('footer.project'), links: [{ to: '/about', title: t('nav.about') }, { to: '/about#contribute', title: t('footer.contribute') }] },
    { title: t('footer.account'), links: user
      ? [{ to: '/dashboard', title: t('nav.dashboard') }, { to: '/profile', title: t('nav.profile') }]
      : [{ to: '/login', title: t('nav.login') }] },
  ];
  return <div className="flex min-h-screen flex-col">
    <Helmet>
      <title>{`FACODI — ${t('brand.tagline')}`}</title>
      <meta name="description" content={t('brand.description')} />
      {privateRoute && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
    <a href="#main" className="sr-only z-50 bg-primary p-4 text-primary-foreground focus:not-sr-only focus:absolute">{t('nav.skip')}</a>
    <header className="sticky top-0 z-30 border-b border-input bg-background">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" aria-label={t('brand.home')} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <img src="/favicon.svg" alt="" width="34" height="34" />FACODI<span className="text-primary" aria-hidden="true">.</span>
        </Link>
        <Button type="button" variant="outline" size="icon" className="xl:hidden" aria-label={t(open ? 'nav.close' : 'nav.menu')} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
        <nav id="navigation" aria-label={t('nav.main')} className={cn('w-full flex-col gap-5 pb-5 xl:flex xl:w-auto xl:flex-row xl:items-center xl:pb-0', open ? 'flex' : 'hidden')}>
          <div className="flex flex-col gap-1 xl:flex-row">
            {links.map(link => <NavLink key={link.to} to={link.to} className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted', isActive && 'bg-muted underline decoration-primary decoration-[3px] underline-offset-[6px]')}>{link.title}</NavLink>)}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{t('common.language')}</span>
            <select className="h-10 rounded-md border border-input bg-background px-2" value={i18n.language.split('-')[0]} onChange={event => {
              const language = event.target.value;
              localStorage.setItem('i18nextLng', language);
              void i18n.changeLanguage(language);
            }}>
              <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
            </select>
          </label>
          {!loading && (user
            ? <Button variant="outline" disabled={signingOut} onClick={logout}>{t('nav.logout')}</Button>
            : <Button asChild><Link to="/login">{t('nav.login')}<ArrowUpRight /></Link></Button>)}
        </nav>
      </div>
    </header>
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 outline-none sm:py-12 lg:px-8">
      <Outlet />
    </main>
    <footer className="mt-12 border-t border-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"><img src="/favicon.svg" alt="" width="28" height="28" />FACODI.</Link>
          <p className="mt-4 max-w-xs leading-relaxed text-muted-foreground">{t('brand.footer')}</p>
        </div>
        {footer.map(column => <nav key={column.title} aria-label={column.title}>
          <h2 className="mb-4 font-semibold">{column.title}</h2>
          <ul className="space-y-3">{column.links.map(link => <li key={link.to}><Link to={link.to} className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">{link.title}</Link></li>)}</ul>
        </nav>)}
      </div>
      <div className="border-t border-input">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-muted-foreground lg:px-8">{t('footer.note')}</p>
      </div>
    </footer>
  </div>;
}
