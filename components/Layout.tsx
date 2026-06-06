import React, { useEffect, useMemo, useState } from 'react';
import { Locale } from '../data/i18n';
import { useAuth } from '../contexts/AuthContext';
import DevelopmentBadge from './DevelopmentBadge';
import DevelopmentDisclaimer from './DevelopmentDisclaimer';
import { useDevelopmentNotice } from '../hooks/useDevelopmentNotice';
import {
  footerCommunityItems,
  footerExploreItems,
  footerLegalItems,
  mainNavigationItems,
  NavigationItem,
  projectNavigationItems,
  secondaryNavigationItems,
} from '../navigation';
import type { View } from '../view';

interface Props {
  children: React.ReactNode;
  currentView: View;
  currentPageSlug?: string | null;
  onViewChange: (view: View) => void;
  onNavigatePage?: (slug: string) => void;
  savedCount: number;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  t: (key: string, defaultValue?: string) => string;
  onOpenAuth: () => void;
}

const Layout: React.FC<Props> = ({
  children,
  currentView,
  currentPageSlug,
  onViewChange,
  onNavigatePage,
  savedCount,
  locale,
  onLocaleChange,
  t,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const { isOpen: isDevelopmentOpen, isReady: isDevelopmentReady, closeNotice, openNotice } = useDevelopmentNotice();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const userNavigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [];
    if (user) {
      items.push({ id: 'student-dashboard', labelKey: 'nav.myCourses', icon: 'video_library', kind: 'view', view: 'student-dashboard', href: '/student/dashboard', activeViews: ['student-dashboard', 'student-my-courses', 'student-progress', 'student-history'] });
      items.push({ id: 'profile', labelKey: 'nav.profile', icon: 'account_circle', kind: 'view', view: 'profile', href: '/profile', activeViews: ['profile'] });
    }
    if (user && (profile?.role === 'editor' || profile?.role === 'admin')) {
      items.push({ id: 'channel-pipeline', labelKey: 'nav.channelPipeline', icon: 'smart_display', kind: 'view', view: 'curator-channel-pipeline', href: '/curator/channel-pipeline', activeViews: ['curator-channel-pipeline'] });
    }
    if (user && profile?.role === 'user') {
      items.push({ id: 'curator-apply', labelKey: 'nav.becomeCurator', icon: 'edit_note', kind: 'view', view: 'curator-apply', href: '/curator/apply', activeViews: ['curator-apply'] });
    }
    if (user && profile?.role === 'admin') {
      items.push({ id: 'admin-dashboard', labelKey: 'nav.adminPanel', icon: 'admin_panel_settings', kind: 'view', view: 'admin-dashboard', href: '/admin', activeViews: ['admin-dashboard', 'admin-curators', 'curator-admin-review'] });
    }
    return items;
  }, [profile?.role, user]);

  const isItemActive = (item: NavigationItem) => {
    if (item.kind === 'page') {
      return currentView === 'institutional-page' && currentPageSlug === item.slug;
    }
    return item.activeViews?.includes(currentView) || item.view === currentView;
  };

  const navigateItem = (item: NavigationItem) => {
    if (item.kind === 'page' && item.slug) {
      onNavigatePage?.(item.slug);
      setMobileOpen(false);
      return;
    }
    if (item.kind === 'view' && item.view) {
      onViewChange(item.view);
      setMobileOpen(false);
    }
  };

  const submitVideoGo = () => {
    if (user) {
      onViewChange('video-submit');
      setMobileOpen(false);
      return;
    }
    setMobileOpen(false);
    onOpenAuth();
  };

  const navButtonClass = (item: NavigationItem) => (
    `transition-all text-[10px] font-bold uppercase tracking-widest px-2.5 py-2 focus-visible:outline-none focus-visible:stark-border focus-visible:bg-primary focus-visible:text-black ${isItemActive(item) ? 'text-black bg-primary stark-border' : 'text-gray-500 hover:text-black hover:bg-brand-muted'}`
  );

  const renderDesktopItem = (item: NavigationItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => navigateItem(item)}
      aria-current={isItemActive(item) ? 'page' : undefined}
      className={navButtonClass(item)}
    >
      {t(item.labelKey)}
    </button>
  );

  const renderDrawerItem = (item: NavigationItem, compact = false) => (
    <button
      key={item.id}
      type="button"
      onClick={() => navigateItem(item)}
      aria-current={isItemActive(item) ? 'page' : undefined}
      className={`text-left w-full ${compact ? 'py-2.5 px-3 text-[10px]' : 'py-3.5 px-4 text-[11px]'} font-bold uppercase tracking-widest transition-all flex items-center justify-between ${isItemActive(item) ? 'bg-primary text-black stark-border' : item.featured ? 'bg-black text-primary stark-border hover:bg-primary hover:text-black' : 'text-gray-600 hover:bg-brand-muted hover:text-black'}`}
    >
      <span>{t(item.labelKey)}</span>
      <span className="material-symbols-outlined text-lg" aria-hidden="true">{item.icon}</span>
    </button>
  );

  const renderFooterItem = (item: NavigationItem) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => navigateItem(item)}
        aria-current={isItemActive(item) ? 'page' : undefined}
        className="inline-flex items-center gap-2 hover:text-black hover:underline focus-visible:outline-none focus-visible:bg-primary focus-visible:text-black"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">{item.icon}</span>
        {t(item.labelKey)}
      </button>
    </li>
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    const onScroll = () => setIsScrolled(window.scrollY > 8);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-black focus:px-4 focus:py-2 focus:font-black focus:text-[10px] focus:uppercase focus:tracking-widest">
        {t('nav.skipToContent')}
      </a>

      <header className={`fixed top-0 w-full z-50 h-16 md:h-20 transition-all ${isScrolled ? 'bg-white/95 backdrop-blur stark-border-b shadow-[0_4px_0_0_rgba(0,0,0,0.06)]' : 'bg-white stark-border-b'}`}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigateItem(mainNavigationItems[0])} aria-label="FACODI - pagina inicial" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:stark-border focus-visible:bg-primary">
            <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">Beta</span>
          </button>

          <nav aria-label={t('nav.primaryLabel')} className="hidden md:flex flex-1 min-w-0 items-center gap-2 lg:gap-3 overflow-x-auto whitespace-nowrap">
            {mainNavigationItems.map(renderDesktopItem)}
            <div className="hidden xl:flex items-center gap-2 border-l border-black/10 pl-3 ml-1">
              {secondaryNavigationItems.map(renderDesktopItem)}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <button
              type="button"
              onClick={submitVideoGo}
              className="hidden lg:inline-flex bg-primary text-black stark-border px-4 h-11 items-center text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-primary transition-all focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(239,255,0,0.6)]"
            >
              {t('nav.submitContent')}
            </button>
            <div className="hidden lg:flex items-center gap-2 border border-black/10 px-3 py-1.5 text-[10px] font-bold uppercase">
              <label htmlFor="facodi-language" className="sr-only">{t('nav.languageLabel')}</label>
              <select id="facodi-language" value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)} className="bg-transparent outline-none cursor-pointer">
                <option value="pt">PT</option>
                <option value="en">EN</option>
              </select>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => onViewChange('profile')}
                aria-label={t('nav.profile')}
                className={`stark-border w-11 h-11 flex items-center justify-center hover:bg-brand-muted transition-all overflow-hidden ${currentView === 'profile' ? 'bg-primary' : ''}`}
                title={profile?.display_name ?? profile?.username ?? t('nav.profile')}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={`Avatar de ${profile?.display_name ?? profile?.username ?? 'utilizador'}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[11px] font-black" aria-hidden="true">{(profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase()}</span>
                )}
              </button>
            ) : (
              <button type="button" onClick={onOpenAuth} className="stark-border px-4 h-11 text-[10px] font-black uppercase tracking-widest hover:bg-brand-muted transition-all">
                {t('nav.login')}
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button type="button" onClick={() => onViewChange('dashboard')} aria-label={t('nav.progress')} className="relative w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:stark-border focus-visible:bg-primary">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">bookmark</span>
              {savedCount > 0 && <span className="absolute top-0 right-0 bg-primary text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center stark-border">{savedCount}</span>}
            </button>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={t('nav.openMenu')} aria-expanded={mobileOpen} aria-controls="mobile-menu" tabIndex={mobileOpen ? -1 : 0} className="w-10 h-10 flex items-center justify-center stark-border hover:bg-brand-muted transition-all text-black focus-visible:outline-none focus-visible:bg-primary">
              <span className="relative block w-5 h-4" aria-hidden="true">
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[100] md:hidden bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden="true" onClick={() => setMobileOpen(false)} />

      <nav
        id="mobile-menu"
        aria-label={t('nav.mobileLabel')}
        aria-hidden={!mobileOpen}
        className={`fixed top-0 right-0 z-[110] h-full w-80 max-w-[90vw] bg-white stark-border-l flex flex-col md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0 visible' : 'translate-x-full invisible pointer-events-none'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 stark-border-b shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-tighter">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">Beta</span>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label={t('nav.closeMenu')} className="w-11 h-11 flex items-center justify-center stark-border hover:bg-brand-muted transition-all focus-visible:outline-none focus-visible:bg-primary">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-7 flex flex-col gap-5">
          <div className="bg-black text-white stark-border p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-3">FACODI</p>
            <p className="text-sm font-bold leading-relaxed text-gray-200">{t('mobileMenu.description')}</p>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">{t('mobileMenu.primary')}</p>
            <div className="flex flex-col gap-1">
              {mainNavigationItems.map((item) => renderDrawerItem(item))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => navigateItem(mainNavigationItems[2])} className="bg-primary text-black py-3 px-4 text-[10px] font-black uppercase tracking-widest stark-border hover:bg-black hover:text-primary transition-all text-center">
              {t('mobileMenu.exploreTrails')}
            </button>
            <button type="button" onClick={submitVideoGo} className="bg-white text-black py-3 px-4 text-[10px] font-black uppercase tracking-widest stark-border hover:bg-brand-muted transition-all text-center">
              {t('mobileMenu.submitContent')}
            </button>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">{t('mobileMenu.secondary')}</p>
            <div className="flex flex-col gap-1">
              {[...secondaryNavigationItems, ...userNavigationItems].map((item) => renderDrawerItem(item, true))}
            </div>
          </div>

          <div className="border-t border-black/10 pt-5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">{t('mobileMenu.project')}</p>
            <div className="flex flex-col gap-1">
              {projectNavigationItems.map((item) => renderDrawerItem(item, true))}
            </div>
          </div>
        </div>

        <div className="shrink-0 px-6 py-5 stark-border-t flex flex-col gap-4 bg-brand-muted/40">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="facodi-language-mobile" className="text-[10px] font-black uppercase tracking-widest">{t('nav.languageLabel')}</label>
            <select id="facodi-language-mobile" value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)} className="bg-white stark-border text-[10px] font-bold uppercase px-3 py-1.5 outline-none cursor-pointer">
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          {user ? (
            <button type="button" onClick={() => { onViewChange('profile'); setMobileOpen(false); }} className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white px-4 py-3 transition-all stark-border w-full">
              <span className="material-symbols-outlined text-base" aria-hidden="true">account_circle</span>
              {t('nav.profile')}
            </button>
          ) : (
            <button type="button" onClick={() => { setMobileOpen(false); onOpenAuth(); }} className="bg-primary text-black py-3 text-[10px] font-black uppercase tracking-widest stark-border w-full">
              {t('nav.login')}
            </button>
          )}
        </div>
      </nav>

      <main id="main-content" className="flex-grow pt-16 md:pt-20">
        {children}
      </main>

      <DevelopmentBadge label={t('development.badge')} onClick={openNotice} />

      <DevelopmentDisclaimer
        isOpen={isDevelopmentReady && isDevelopmentOpen}
        title={t('development.title')}
        body={t('development.body')}
        signedMessage={t('development.message')}
        signature={t('development.signature')}
        institutionalLine={t('development.institutional')}
        closeLabel={t('development.close')}
        onClose={() => closeNotice(true)}
      />

      <footer className="bg-white border-t-2 border-black pt-16 md:pt-20 pb-10 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10 xl:gap-14 mb-16">
            <div className="xl:col-span-4">
              <button type="button" onClick={() => navigateItem(mainNavigationItems[0])} className="text-left focus-visible:outline-none focus-visible:bg-primary focus-visible:text-black">
                <h3 className="text-xl font-black tracking-tighter uppercase mb-6">FACODI</h3>
              </button>
              <p className="text-[11px] text-gray-500 font-medium leading-loose uppercase tracking-[0.1em] max-w-md mb-6">
                {t('footer.description')}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('footer.mission')}</p>
            </div>

            <div className="xl:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{t('footer.explore')}</h5>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                {footerExploreItems.map(renderFooterItem)}
              </ul>
            </div>

            <div className="xl:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{t('footer.community')}</h5>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                {footerCommunityItems.map((item) => item.id === 'suggest-content' ? (
                  <li key={item.id}>
                    <button type="button" onClick={submitVideoGo} className="inline-flex items-center gap-2 hover:text-black hover:underline focus-visible:outline-none focus-visible:bg-primary focus-visible:text-black">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">{item.icon}</span>
                      {t(item.labelKey)}
                    </button>
                  </li>
                ) : renderFooterItem(item))}
              </ul>
            </div>

            <div className="xl:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{t('footer.institutional')}</h5>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                {footerLegalItems.map(renderFooterItem)}
              </ul>
            </div>

            <div className="xl:col-span-2">
              <div className="bg-brand-muted p-6 stark-border flex flex-col gap-5 h-full">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl" aria-hidden="true">monitoring</span>
                  <p className="text-[10px] font-black uppercase">Open2 Technology</p>
                </div>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider text-gray-500">{t('footer.open2')}</p>
                <a href="https://open2.tech" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest underline hover:text-black">
                  open2.tech
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-black/10 flex flex-col gap-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 leading-relaxed">{t('institutional.footer.text')}</p>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-10">
              <p className="max-w-2xl text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 leading-relaxed">{t('footer.copyright')}</p>
              <details className="w-full lg:w-auto max-w-2xl cursor-pointer">
                <summary className="hover:text-black hover:underline list-none text-[9px] font-bold uppercase tracking-[0.24em]">{t('footer.legalNotice')}</summary>
                <div className="mt-3 text-[8px] font-medium leading-relaxed p-4 bg-gray-50 stark-border tracking-[0.02em]">
                  <p>{t('institutional.disclaimer.pt')}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
