import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BookOpen, LayoutDashboard, Layers, Lightbulb, ListOrdered, ListVideo, LogOut, Menu, Moon, NotebookPen, PenSquare, Search, ShieldCheck, Sun, UserRound, UsersRound, Info, PlayCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { INTERFACE_LANGUAGES, setInterfaceLanguage } from '@/i18n/config';
import { useTheme } from '@/shared/theme/theme';
import { cn } from '@/lib/utils';

const DESKTOP_QUERY = '(min-width: 800px)';

function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  return <label className="flex min-w-0 items-center gap-3 text-sm">
    <span className={cn(compact && 'sr-only')}>{t('common.language')}</span>
    <select className={cn('h-11 min-w-0 border border-input bg-background', compact ? 'px-1.5 2xl:px-2' : 'px-2')} value={i18n.language.split('-')[0]} onChange={event => setInterfaceLanguage(event.target.value)}>
      {INTERFACE_LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{compact ? code.toUpperCase() : label}</option>)}
    </select>
  </label>;
}

/** Public navigation stays independent of account permissions and label length. */
export function SiteHeader() {
  const { t } = useTranslation();
  const { user, role, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const dark = theme === 'dark';
  const primaryLinks = [
    { to: '/courses', title: t('nav.courses'), icon: BookOpen, hoverTone: 'hover:bg-primary hover:text-ink', activeTone: 'bg-primary text-ink hover:bg-primary-hover' },
    { to: '/units', title: t('nav.units'), icon: Layers, hoverTone: 'hover:bg-brand-orange hover:text-ink', activeTone: 'bg-brand-orange text-ink hover:brightness-95' },
    { to: '/resources', title: t('nav.resources'), icon: PlayCircle, hoverTone: 'hover:bg-brand-mint hover:text-ink', activeTone: 'bg-brand-mint text-ink hover:brightness-95' },
    { to: '/sequences', title: t('nav.sequences'), icon: ListOrdered, hoverTone: 'hover:bg-brand-pink hover:text-ink', activeTone: 'bg-brand-pink text-ink hover:brightness-95' },
    { to: '/about', title: t('nav.about'), icon: Info, hoverTone: 'hover:bg-brand-coral hover:text-ink', activeTone: 'bg-brand-coral text-ink hover:brightness-95' },
    { to: '/community', title: t('projectCommunity.nav'), icon: UsersRound, hoverTone: 'hover:bg-brand-mint hover:text-ink', activeTone: 'bg-brand-mint text-ink hover:brightness-95' },
    { to: '/suggest', title: t('suggest.nav'), icon: Lightbulb, hoverTone: 'border border-brand-cyan/60 bg-brand-cyan/15 hover:border-brand-cyan hover:bg-brand-cyan hover:text-ink', activeTone: 'border border-foreground bg-brand-cyan text-ink hover:brightness-95' },
  ];
  const accountLinks = [
    { to: '/dashboard', title: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/notes', title: t('nav.notes'), icon: NotebookPen },
    { to: '/profile', title: t('nav.profile'), icon: UserRound },
    { to: '/suggest', title: t('suggest.nav'), icon: Lightbulb },
    { to: '/playlists/submit', title: t('playlistSubmit.nav'), icon: ListVideo },
    ...(canAccessFacodiRoute(role, 'editor') ? [{ to: '/editor', title: t('nav.editor'), icon: PenSquare }] : []),
    ...(role === 'admin' ? [{ to: '/admin', title: t('nav.admin'), icon: ShieldCheck }] : []),
  ];
  const mobileAccountLinks = accountLinks.filter(link => !primaryLinks.some(primary => primary.to === link.to));

  useEffect(() => { setOpen(false); setSearchOpen(false); }, [location]);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeMobile = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeMobile);
    return () => desktop.removeEventListener('change', closeMobile);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (event.key === '/' && !typing && !open && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        searchTrigger.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, searchOpen]);

  async function logout() {
    setSigningOut(true);
    try { await signOut(); setOpen(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('common.error')); }
    finally { setSigningOut(false); }
  }
  const navigationClass = (hoverTone = 'hover:bg-muted', activeTone = 'bg-primary text-primary-foreground hover:bg-primary-hover') =>
    ({ isActive }: { isActive: boolean }) => cn(
      'flex min-h-11 items-center gap-3 px-3 py-2 text-sm font-semibold text-foreground transition-colors min-[800px]:gap-1.5 min-[800px]:whitespace-nowrap min-[800px]:px-2 min-[800px]:text-[13px] xl:gap-1 xl:px-1.5 2xl:gap-1.5 2xl:px-2.5 2xl:text-sm',
      isActive ? activeTone : hoverTone,
    );

  return <header className="sticky top-0 z-30 border-b border-foreground/25 bg-background">
    <div aria-hidden="true" className="grid h-1 grid-cols-6">
      <span className="bg-primary" />
      <span className="bg-brand-orange" />
      <span className="bg-brand-pink" />
      <span className="bg-brand-cyan" />
      <span className="bg-brand-mint" />
      <span className="bg-brand-coral" />
    </div>
    <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-5 min-[800px]:max-xl:grid min-[800px]:max-xl:h-auto min-[800px]:max-xl:grid-cols-[auto_1fr_auto] min-[800px]:max-xl:gap-x-4 min-[800px]:max-xl:gap-y-0 min-[800px]:max-xl:px-5 xl:gap-2 xl:px-4 2xl:gap-3 2xl:px-8">
      <Link to="/" aria-label={t('brand.home')} className="flex shrink-0 items-center gap-2 text-2xl font-bold tracking-tight min-[800px]:max-xl:col-start-1 min-[800px]:max-xl:row-start-1 min-[800px]:max-xl:h-16 xl:max-2xl:text-xl">
        <img src="/favicon.svg" alt="" width="34" height="34" className="xl:max-2xl:size-8" /><span className={cn(searchOpen && 'max-sm:sr-only')}>FACODI<span className="text-brand-cyan" aria-hidden="true">.</span></span>
      </Link>
      {searchOpen && <div id="header-search" className="min-w-0 flex-1 max-w-xl min-[800px]:max-xl:col-start-2 min-[800px]:max-xl:row-start-1 min-[800px]:max-xl:mx-auto min-[800px]:max-xl:w-full xl:mx-4 xl:max-w-2xl">
        <HeaderSearch autoFocus onSubmitted={() => { setSearchOpen(false); searchTrigger.current?.focus(); }} />
      </div>}
      <nav aria-label={t('nav.main')} className={cn('hidden min-w-0 items-center gap-1 min-[800px]:flex min-[800px]:max-xl:col-span-3 min-[800px]:max-xl:row-start-2 min-[800px]:max-xl:flex-wrap min-[800px]:max-xl:border-t min-[800px]:max-xl:border-border min-[800px]:max-xl:py-1.5 xl:gap-0.5 2xl:gap-1', searchOpen && 'xl:hidden')}>
        {primaryLinks.map(({ to, title, icon: Icon, hoverTone, activeTone }) => <NavLink key={to} to={to} className={navigationClass(hoverTone, activeTone)}><Icon className="size-4 shrink-0 xl:max-2xl:size-3.5" aria-hidden="true" />{title}</NavLink>)}
      </nav>
      <div className="flex shrink-0 items-center gap-2 min-[800px]:max-xl:col-start-3 min-[800px]:max-xl:row-start-1 min-[800px]:max-xl:h-16 xl:gap-1.5 2xl:gap-2">
        <Button ref={searchTrigger} type="button" variant="ghost" size="icon" className="size-11" aria-label={t('resourceExplorer.searchLabel')}
          title={`${t('resourceExplorer.searchLabel')} (/)`} aria-expanded={searchOpen} aria-controls="header-search" onClick={() => setSearchOpen(value => !value)}>
          {searchOpen ? <X /> : <Search />}
        </Button>
        <div className="hidden min-[800px]:block"><LanguageSelect compact /></div>
        <Button type="button" variant="ghost" size="icon" className="hidden size-11 sm:inline-flex" aria-label={t(dark ? 'nav.themeLight' : 'nav.themeDark')} title={t(dark ? 'nav.themeLight' : 'nav.themeDark')}
          onClick={() => setTheme(dark ? 'light' : 'dark')}>
          {dark ? <Sun /> : <Moon />}
        </Button>
        <div className="hidden min-[800px]:block">
          {!loading && (user ? <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" className="size-11" aria-label={t('footer.account')} title={t('footer.account')}><UserRound /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 overflow-y-auto">
              <DropdownMenuLabel>{t('footer.account')}</DropdownMenuLabel>
              <DropdownMenuGroup>{accountLinks.map(({ to, title, icon: Icon }) => <DropdownMenuItem key={to} asChild className="min-h-11 gap-3">
                <Link to={to} aria-current={location.pathname === to ? 'page' : undefined}><Icon className="size-4 shrink-0" aria-hidden="true" />{title}</Link>
              </DropdownMenuItem>)}</DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup><DropdownMenuItem disabled={signingOut} onSelect={event => { event.preventDefault(); void logout(); }} className="min-h-11 gap-3"><LogOut className="size-4" aria-hidden="true" />{t('nav.logout')}</DropdownMenuItem></DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu> : <Button asChild className="xl:max-2xl:px-3"><Link to="/login">{t('nav.login')}<ArrowUpRight className="xl:max-2xl:hidden" /></Link></Button>)}
        </div>
        <Sheet open={open} onOpenChange={value => { setOpen(value); if (value) setSearchOpen(false); }}>
          <SheetTrigger asChild><Button type="button" variant="outline" size="icon" className={cn('size-11 min-[800px]:hidden', searchOpen && 'max-sm:hidden')} aria-label={t('nav.menu')}><Menu /></Button></SheetTrigger>
          <SheetContent side="right" hideClose aria-describedby={undefined} className="flex h-dvh w-full flex-col gap-0 p-0 sm:max-w-sm"
            onCloseAutoFocus={event => {
              if (typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches && searchTrigger.current) {
                event.preventDefault();
                searchTrigger.current.focus();
              }
            }}>
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
              <SheetTitle>{t('nav.main')}</SheetTitle>
              <SheetClose asChild><Button type="button" variant="ghost" size="icon" className="size-11" aria-label={t('nav.close')}><X /></Button></SheetClose>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
              <HeaderSearch onSubmitted={() => setOpen(false)} />
              <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
                {primaryLinks.map(({ to, title, icon: Icon, hoverTone, activeTone }) => <NavLink key={to} to={to} className={navigationClass(hoverTone, activeTone)} onClick={() => setOpen(false)}><Icon className="size-4 shrink-0" aria-hidden="true" />{title}</NavLink>)}
              </nav>
              {!loading && <>
                <Separator />
                {user ? <nav aria-label={t('footer.account')} className="flex flex-col gap-1">
                  <p className="mb-1 px-3 text-sm font-semibold text-muted-foreground">{t('footer.account')}</p>
                  {mobileAccountLinks.map(({ to, title, icon: Icon }) => <NavLink key={to} to={to} className={navigationClass()} onClick={() => setOpen(false)}><Icon className="size-4 shrink-0" aria-hidden="true" />{title}</NavLink>)}
                  <Button variant="outline" className="mt-3 min-h-11" disabled={signingOut} onClick={logout}><LogOut />{t('nav.logout')}</Button>
                </nav> : <Button asChild className="min-h-11"><Link to="/login">{t('nav.login')}<ArrowUpRight /></Link></Button>}
              </>}
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <LanguageSelect />
                <Button type="button" variant="outline" size="icon" className="size-11" aria-label={t(dark ? 'nav.themeLight' : 'nav.themeDark')} onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun /> : <Moon />}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>;
}
