
import React, { useEffect, useState } from 'react';
import { Locale } from '../data/i18n';
import { useAuth } from '../contexts/AuthContext';
import DevelopmentBadge from './DevelopmentBadge';
import DevelopmentDisclaimer from './DevelopmentDisclaimer';
import { useDevelopmentNotice } from '../hooks/useDevelopmentNotice';
import type { View } from '../view';

interface Props {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigatePage?: (slug: string) => void;
  savedCount: number;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  t: (key: string) => string;
  onOpenAuth: () => void;
}

const Layout: React.FC<Props> = ({
  children,
  currentView,
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

  const projectLinks = [
    { slug: 'manifesto', label: 'Manifesto', icon: 'flag' },
    { slug: 'sobre', label: 'Sobre a FACODI', icon: 'school' },
    { slug: 'comunidade', label: 'Comunidade Open2', icon: 'groups' },
    { slug: 'roadmap', label: 'Roadmap', icon: 'route' },
    { slug: 'como-contribuir', label: 'Como Contribuir', icon: 'volunteer_activism' },
  ];

  const navGo = (view: View) => { onViewChange(view); setMobileOpen(false); };
  const pageGo = (slug: string) => { onNavigatePage?.(slug); setMobileOpen(false); };
  const submitVideoGo = () => {
    if (user) {
      navGo('video-submit');
      return;
    }
    setMobileOpen(false);
    onOpenAuth();
  };
  const isActive = (view: View, extra?: View[]) => currentView === view || (extra?.includes(currentView) ?? false);
  const navCls = (view: View, extra?: View[]) =>
    `transition-all text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 focus-visible:outline-none focus-visible:stark-border focus-visible:bg-primary focus-visible:text-black ${isActive(view, extra) ? 'text-black bg-primary stark-border' : 'text-gray-500 hover:text-black hover:bg-brand-muted'}`;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

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
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-black focus:px-4 focus:py-2 focus:font-black focus:text-[10px] focus:uppercase focus:tracking-widest">
        Ir para conteúdo
      </a>

      <header className={`fixed top-0 w-full z-50 h-16 md:h-20 transition-all ${isScrolled ? 'bg-white/95 backdrop-blur stark-border-b shadow-[0_4px_0_0_rgba(0,0,0,0.06)]' : 'bg-white stark-border-b'}`}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center justify-between gap-3">
          {/* Logo */}
          <button onClick={() => navGo('home')} aria-label="FACODI — Página inicial" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">
              Beta
            </span>
          </button>

          {/* Desktop nav */}
          <nav aria-label="Navegação principal" className="hidden md:flex flex-1 min-w-0 items-center gap-4 lg:gap-6 overflow-x-auto whitespace-nowrap">
            <button onClick={() => navGo('home')} aria-current={isActive('home') ? 'page' : undefined} className={navCls('home')}>{t('nav.home')}</button>
            <button onClick={() => navGo('courses')} aria-current={isActive('courses') ? 'page' : undefined} className={navCls('courses')}>{t('nav.courses')}</button>
            <button onClick={() => navGo('repository')} aria-current={isActive('repository', ['course-detail', 'lesson-detail']) ? 'page' : undefined} className={navCls('repository', ['course-detail', 'lesson-detail'])}>{t('nav.units')}</button>
            <button onClick={() => navGo('dashboard')} aria-current={isActive('dashboard') ? 'page' : undefined} className={`relative ${navCls('dashboard')}`}>
              {t('nav.progress')}
              {savedCount > 0 && (
                <span className="absolute -top-3 -right-3 bg-primary text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center stark-border">{savedCount}</span>
              )}
            </button>
            {user && (
              <button onClick={() => navGo('student-dashboard')} aria-current={isActive('student-dashboard', ['student-my-courses', 'student-progress', 'student-history']) ? 'page' : undefined} className={navCls('student-dashboard', ['student-my-courses', 'student-progress', 'student-history'])}>
                Meus Cursos
              </button>
            )}
            {user && (
              <button onClick={() => navGo('profile')} aria-current={isActive('profile') ? 'page' : undefined} className={navCls('profile')}>
                {t('nav.profile')}
              </button>
            )}
            {user && (profile?.role === 'editor' || profile?.role === 'admin') && (
              <button onClick={() => navGo('curator-channel-pipeline')} aria-current={isActive('curator-channel-pipeline') ? 'page' : undefined} className={navCls('curator-channel-pipeline')}>
                Pipeline de Canal
              </button>
            )}
            {user && profile?.role === 'user' && (
              <button onClick={() => navGo('curator-apply')} aria-current={isActive('curator-apply') ? 'page' : undefined} className={navCls('curator-apply')}>
                Ser Curador
              </button>
            )}
            {user && profile?.role === 'admin' && (
              <button onClick={() => navGo('admin-dashboard')} aria-current={isActive('admin-dashboard', ['admin-curators', 'curator-admin-review']) ? 'page' : undefined} className={navCls('admin-dashboard', ['admin-curators', 'curator-admin-review'])}>
                Painel Admin
              </button>
            )}
            <button onClick={() => navGo('blog')} aria-current={isActive('blog', ['blog-post']) ? 'page' : undefined} className={navCls('blog', ['blog-post'])}>
              {t('nav.blog')}
            </button>
            <button onClick={() => pageGo('manifesto')} className="transition-all text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 text-gray-500 hover:text-black hover:bg-brand-muted">
              Manifesto
            </button>
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 border border-black/10 px-3 py-1.5 text-[10px] font-bold uppercase">
              <label htmlFor="facodi-language" className="sr-only">{t('nav.languageLabel')}</label>
              <select id="facodi-language" value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)} className="bg-transparent outline-none cursor-pointer">
                <option value="pt">PT</option>
                <option value="en">EN</option>
              </select>
            </div>
            {user ? (
              <button
                onClick={() => navGo('profile')}
                aria-label="Atalho de perfil"
                className={`stark-border w-11 h-11 flex items-center justify-center hover:bg-brand-muted transition-all overflow-hidden ${isActive('profile') ? 'bg-primary' : ''}`}
                title={profile?.display_name ?? profile?.username ?? t('nav.profile')}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`Avatar de ${profile?.display_name ?? profile?.username ?? 'utilizador'}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[11px] font-black" aria-hidden="true">{(profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase()}</span>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="stark-border px-4 h-11 text-[10px] font-black uppercase tracking-widest hover:bg-brand-muted transition-all"
              >
                {t('nav.login')}
              </button>
            )}
          </div>

          {/* Mobile: bookmark + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => navGo('dashboard')} aria-label="Meu progresso" className="relative w-11 h-11 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">bookmark</span>
              {savedCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center stark-border">{savedCount}</span>
              )}
            </button>
            <button onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-menu" className="w-10 h-10 flex items-center justify-center stark-border hover:bg-brand-muted transition-all text-black">
              <span className="relative block w-5 h-4" aria-hidden="true">
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div className={`fixed inset-0 z-[100] md:hidden bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden="true" onClick={() => setMobileOpen(false)} />

      {/* Mobile drawer */}
      <nav
        id="mobile-menu"
        aria-label="Menu mobile"
        aria-hidden={!mobileOpen}
        className={`fixed top-0 right-0 z-[110] h-full w-80 max-w-[90vw] bg-white stark-border-l flex flex-col md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0 visible' : 'translate-x-full invisible pointer-events-none'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 stark-border-b shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-tighter">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">
              Beta
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="w-11 h-11 flex items-center justify-center stark-border hover:bg-brand-muted transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Navegar</p>
          {([
            { view: 'home' as View, label: t('nav.home'), icon: 'home' },
            { view: 'courses' as View, label: t('nav.courses'), icon: 'school' },
            { view: 'repository' as View, label: t('nav.units'), icon: 'grid_view' },
            { view: 'dashboard' as View, label: t('nav.progress'), icon: 'dashboard' },
            { view: 'blog' as View, label: t('nav.blog'), icon: 'article' },
            ...(user ? [{ view: 'student-dashboard' as View, label: 'Meus Cursos', icon: 'video_library' }] : []),
            ...(user && (profile?.role === 'editor' || profile?.role === 'admin') ? [{ view: 'curator-channel-pipeline' as View, label: 'Pipeline de Canal', icon: 'smart_display' }] : []),
            ...(user && profile?.role === 'user' ? [{ view: 'curator-apply' as View, label: 'Ser Curador', icon: 'edit_note' }] : []),
            ...(user && profile?.role === 'admin' ? [{ view: 'admin-dashboard' as View, label: 'Painel Admin', icon: 'admin_panel_settings' }] : []),
          ] as { view: View; label: string; icon: string }[]).map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => navGo(view)}
              className={`text-left w-full py-3 px-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-between ${currentView === view ? 'bg-primary text-black stark-border' : 'text-gray-600 hover:bg-brand-muted hover:text-black'}`}
            >
              <span>{label}</span>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </button>
          ))}
          <div className="border-t border-black/10 mt-6 pt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Projeto</p>
            {projectLinks.map(({ slug, label, icon }) => (
              <button
                key={slug}
                onClick={() => pageGo(slug)}
                className="text-left w-full py-3 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-600 hover:bg-brand-muted hover:text-black transition-all flex items-center justify-between"
              >
                <span>{label}</span>
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-6 py-6 stark-border-t flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label htmlFor="facodi-language-mobile" className="text-[10px] font-black uppercase tracking-widest">Idioma</label>
            <select id="facodi-language-mobile" value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)} className="bg-white stark-border text-[10px] font-bold uppercase px-3 py-1.5 outline-none cursor-pointer">
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          {user ? (
            <button onClick={() => { navGo('profile'); }} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-muted px-4 py-3 transition-all stark-border w-full">
              <span className="material-symbols-outlined text-base">account_circle</span>
              {t('nav.profile')}
            </button>
          ) : (
            <button onClick={() => { setMobileOpen(false); onOpenAuth(); }} className="bg-primary text-black py-3 text-[10px] font-black uppercase tracking-widest stark-border w-full">
              {t('nav.login')}
            </button>
          )}
          <button
            onClick={submitVideoGo}
            className="bg-white text-black py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:bg-brand-muted transition-all w-full text-center"
          >
            Enviar Conteudo
          </button>
        </div>
      </nav>

      <main id="main-content" className="flex-grow pt-16 md:pt-20">
        {children}
      </main>

      <DevelopmentBadge
        label={t('development.badge')}
        onClick={openNotice}
      />

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

      <footer className="bg-white border-t-2 border-black pt-20 pb-10 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <h3 className="text-xl font-black tracking-tighter uppercase mb-8">FACODI — FACULDADE COMUNITÁRIA DIGITAL</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-loose uppercase tracking-[0.1em] max-w-sm mb-8">
                Currículos oficiais com playlists abertas, progresso comunitário e orgulho Open2 Technology.
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Conteúdo disponível sob licença aberta e amor comunitário.</p>
              <div className="flex gap-4 mt-8">
                <a
                  href="https://open2.tech/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contactar Open2 Technology"
                  className="w-10 h-10 stark-border flex items-center justify-center hover:bg-primary transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">contact_support</span>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">NAVEGAÇÃO</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                <li><button onClick={() => onViewChange('home')} className="hover:text-black hover:underline">Início</button></li>
                <li><button onClick={() => onViewChange('repository')} className="hover:text-black hover:underline">Cursos</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">COMUNIDADE</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                <li><button onClick={() => onNavigatePage?.('manifesto')} className="hover:text-black hover:underline">Manifesto</button></li>
                <li><button onClick={() => onNavigatePage?.('sobre')} className="hover:text-black hover:underline">Sobre a FACODI</button></li>
                <li><button onClick={() => onNavigatePage?.('comunidade')} className="hover:text-black hover:underline">Comunidade</button></li>
                <li><button onClick={submitVideoGo} className="hover:text-black hover:underline">Enviar Conteudo</button></li>
                <li><button onClick={() => onNavigatePage?.('contacto')} className="hover:text-black hover:underline">Contacto</button></li>
                <li><a href="https://open2.tech" className="hover:text-black hover:underline">Open2 Technology</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="bg-brand-muted p-8 stark-border flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-2xl">monitoring</span>
                   <p className="text-[10px] font-black uppercase">Open2 Technology</p>
                </div>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider text-gray-500">
                   FACODI IS PART OF THE OPEN2 TECHNOLOGY OPEN ECOSYSTEM, PROMOTING ACCESSIBLE TECH FOR THE GLOBAL SOUTH.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-black/10">
            {/* Institutional reference section */}
            <div className="mb-8 pb-8 border-b border-black/10">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 leading-relaxed">
                {t('institutional.footer.text')}
              </p>
            </div>

            {/* Copyright and disclaimer */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-10">
                <p className="max-w-2xl text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 leading-relaxed">
                  © 2026 OPEN2 TECHNOLOGY. CONSTRUÍDO COM CARINHO PELA COMUNIDADE FACODI.
                </p>
                <div className="w-full lg:w-auto flex flex-wrap items-center gap-x-6 gap-y-3 text-[9px] font-bold uppercase tracking-[0.24em]">
                  <button onClick={submitVideoGo} className="hover:text-black hover:underline">ENVIAR CONTEUDO</button>
                  <a href="https://open2.tech/contact" target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline">CONTACTO</a>
                  <button onClick={() => onNavigatePage?.('privacidade')} className="hover:text-black hover:underline">PRIVACIDADE</button>
                  <button onClick={() => onNavigatePage?.('termos')} className="hover:text-black hover:underline">TERMOS</button>
                  <button onClick={() => onNavigatePage?.('cookies')} className="hover:text-black hover:underline">COOKIES</button>
                </div>
              </div>

              <div className="flex lg:justify-end">
                <details className="w-full lg:w-auto max-w-2xl cursor-pointer">
                  <summary className="hover:text-black hover:underline list-none text-[9px] font-bold uppercase tracking-[0.24em]">AVISO LEGAL</summary>
                  <div className="mt-3 text-[8px] font-medium leading-relaxed p-4 bg-gray-50 stark-border tracking-[0.02em]">
                    <p>{t('institutional.disclaimer.pt')}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
