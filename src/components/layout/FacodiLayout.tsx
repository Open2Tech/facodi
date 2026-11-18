import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BookOpen, Info, Layers, LayoutDashboard, Lightbulb, ListOrdered, ListVideo, Menu, Moon, PenSquare, PlayCircle, ShieldCheck, Sun, UsersRound, X, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/shared/theme/theme';
import { Helmet } from 'react-helmet-async';
import { useSeoClaims } from '@/components/layout/seoClaims';
import { toast } from 'sonner';
import { LEGAL_DOCUMENTS, legalPath } from '@/components/legal/legalDocuments';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { SOCIAL_PROFILES } from '@/shared/seo/seo';
import { cn } from '@/lib/utils';
import { INTERFACE_LANGUAGES, setInterfaceLanguage } from '@/i18n/config';

export default function FacodiLayout() {
  const { t, i18n } = useTranslation();
  const { user, role, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  const seoClaims = useSeoClaims();
  const isWorkersPreview = window.location.hostname === 'facodi.marcelo-0d6.workers.dev';
  const privateRoute = location.pathname.startsWith('/community/join') || ['/dashboard', '/profile', '/notes', '/playlists', '/suggest', '/editor', '/admin', '/login', '/auth'].some(path => location.pathname.startsWith(path));
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
  const links: { to: string; title: string; icon: LucideIcon; compact?: boolean }[] = [
    { to: '/courses', title: t('nav.courses'), icon: BookOpen },
    { to: '/units', title: t('nav.units'), icon: Layers },
    { to: '/resources', title: t('nav.resources'), icon: PlayCircle },
    { to: '/sequences', title: t('nav.sequences'), icon: ListOrdered },
    { to: '/about', title: t('nav.about'), icon: Info },
    { to: '/community', title: t('projectCommunity.nav'), icon: UsersRound },
    ...(user ? [{ to: '/suggest', title: t('suggest.nav'), icon: Lightbulb, compact: true }] : []),
    ...(user ? [{ to: '/playlists/submit', title: t('playlistSubmit.nav'), icon: ListVideo, compact: true }] : []),
    ...(user ? [{ to: '/dashboard', title: t('nav.dashboard'), icon: LayoutDashboard, compact: true }] : []),
    ...(canAccessFacodiRoute(role, 'editor') ? [{ to: '/editor', title: t('nav.editor'), icon: PenSquare, compact: true }] : []),
    ...(role === 'admin' ? [{ to: '/admin', title: t('nav.admin'), icon: ShieldCheck, compact: true }] : []),
  ];
  const footer = [
    { title: t('footer.learn'), links: [{ to: '/courses', title: t('content.courses') }, { to: '/units', title: t('content.curricular_units') }, { to: '/resources', title: t('nav.resources') }, { to: '/sequences', title: t('nav.sequences') }] },
    { title: t('footer.project'), links: [{ to: '/about', title: t('nav.about') }, { to: '/how-it-works', title: t('learningGuide.nav') }, { to: '/community', title: t('projectCommunity.nav') }, { to: '/about#contribute', title: t('footer.contribute') }, ...(user ? [{ to: '/suggest', title: t('suggest.nav') }] : [])] },
    { title: t('footer.account'), links: user
      ? [{ to: '/dashboard', title: t('nav.dashboard') }, { to: '/notes', title: t('nav.notes') }, { to: '/profile', title: t('nav.profile') }]
      : [{ to: '/login', title: t('nav.login') }, { to: '/notes', title: t('nav.notes') }] },
  ];
  const legalLinks = LEGAL_DOCUMENTS.map(document => ({ to: legalPath(document), title: t(`legal.nav.${document}`) }));
  return <div className="flex min-h-screen flex-col">
    <Helmet>
      {!seoClaims.page && <title>{`FACODI — ${t('brand.tagline')}`}</title>}
      {!seoClaims.page && <meta name="description" content={t('brand.description')} />}
      {(privateRoute || isWorkersPreview) && !seoClaims.robots && <meta name="robots" content="noindex, nofollow, noarchive" />}
    </Helmet>
    <a href="#main" className="sr-only z-50 bg-primary p-4 text-primary-foreground focus:not-sr-only focus:absolute">{t('nav.skip')}</a>
    <header className="sticky top-0 z-30 border-b border-input bg-background">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" aria-label={t('brand.home')} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <img src="/favicon.svg" alt="" width="34" height="34" /><span>FACODI<span className="text-brand-cyan" aria-hidden="true">.</span></span>
        </Link>
        <Button type="button" variant="outline" size="icon" className="xl:hidden" aria-label={t(open ? 'nav.close' : 'nav.menu')} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
        <nav id="navigation" aria-label={t('nav.main')} className={cn('w-full flex-col gap-5 pb-5 xl:flex xl:w-auto xl:flex-row xl:items-center xl:pb-0', open ? 'flex' : 'hidden')}>
          <div className="flex flex-col gap-1 xl:flex-row">
            {/* Account links collapse to icons on narrow desktops so the signed-in bar stays on one line. */}
            {links.map(({ to, title, icon: Icon, compact }) => <NavLink key={to} to={to} title={compact ? title : undefined} className={({ isActive }) => cn('inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted', isActive && 'bg-primary text-primary-foreground hover:bg-primary-hover')}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className={cn(compact && 'xl:sr-only 2xl:not-sr-only')}>{title}</span>
            </NavLink>)}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">{t('common.language')}</span>
              <select className="h-10 rounded-md border border-input bg-background px-2" value={i18n.language.split('-')[0]} onChange={event => setInterfaceLanguage(event.target.value)}>
                {INTERFACE_LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={t(dark ? 'nav.themeLight' : 'nav.themeDark')} title={t(dark ? 'nav.themeLight' : 'nav.themeDark')}
              onClick={() => setTheme(dark ? 'light' : 'dark')}>
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
          {!loading && (user
            ? <Button variant="outline" disabled={signingOut} onClick={logout}>{t('nav.logout')}</Button>
            : <Button asChild><Link to="/login">{t('nav.login')}<ArrowUpRight /></Link></Button>)}
        </nav>
      </div>
    </header>
    {/* At least one screen tall (minus the 5rem header), so the footer starts below the fold while a page loads
        its data and never jumps into view (cumulative layout shift). */}
    <main id="main" tabIndex={-1} className="mx-auto min-h-[calc(100svh-5rem)] w-full max-w-7xl flex-1 px-5 py-8 outline-none sm:py-12 lg:px-8">
      <Outlet />
    </main>
    <footer className="mt-12 border-t-4 border-primary bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 text-sm sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"><img src="/favicon.svg" alt="" width="28" height="28" /><span>FACODI<span className="text-primary" aria-hidden="true">.</span></span></Link>
          <p className="mt-4 max-w-xs leading-relaxed text-ink-foreground/75">{t('brand.footer')}</p>
          <a href={SOCIAL_PROFILES[0]} target="_blank" rel="me noopener noreferrer" className="mt-4 inline-flex items-center gap-1 font-medium text-ink-foreground/85 underline-offset-4 transition-colors hover:text-primary hover:underline">
            {t('footer.instagram')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        {footer.map(column => <nav key={column.title} aria-label={column.title}>
          <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.12em] text-brand-cyan">{column.title}</h2>
          <ul className="space-y-3">{column.links.map(link => <li key={link.to}><Link to={link.to} className="font-medium text-ink-foreground/85 underline-offset-4 transition-colors hover:text-primary hover:underline">{link.title}</Link></li>)}</ul>
        </nav>)}
      </div>
      <div className="border-t border-ink-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-mono text-xs text-ink-foreground/70">{t('footer.note')}</p>
          <nav aria-label={t('footer.legal')}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">{legalLinks.map(link => <li key={link.to}><Link to={link.to} className="text-ink-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline">{link.title}</Link></li>)}</ul>
          </nav>
        </div>
      </div>
    </footer>
  </div>;
}
