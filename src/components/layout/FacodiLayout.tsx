import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSeoClaims } from '@/components/layout/seoClaims';
import { LEGAL_DOCUMENTS, legalPath } from '@/components/legal/legalDocuments';
import { useAuth } from '@/features/auth/useAuth';
import { SOCIAL_PROFILES } from '@/shared/seo/seo';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default function FacodiLayout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const seoClaims = useSeoClaims();
  const isWorkersPreview = window.location.hostname === 'facodi.marcelo-0d6.workers.dev';
  const privateRoute = location.pathname.startsWith('/community/join') || ['/dashboard', '/profile', '/notes', '/playlists', '/suggest', '/editor', '/admin', '/login', '/auth'].some(path => location.pathname.startsWith(path));
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => { document.documentElement.lang = i18n.language; }, [i18n.language]);
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
    <SiteHeader />
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
