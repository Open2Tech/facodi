import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Compass,
   Globe,
  Lightbulb,
  ListOrdered,
  ListVideo,
  NotebookPen,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { recognizeUrl } from '@/entities/suggestion/recognition';
import { PROVIDERS } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

export interface HomeHeroCounts {
  courses: number;
  units: number;
  resources: number;
  videos: number;
}

export interface HomeHeroProps {
  counts?: HomeHeroCounts;
}

type NotebookMode = 'explore' | 'suggest';

const CAMPUS_FEATURES: {
  key: 'sequences' | 'notes' | 'playlists';
  to: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  { key: 'sequences', to: '/sequences', icon: ListOrdered, tone: 'bg-brand-pink' },
  { key: 'notes', to: '/notes', icon: NotebookPen, tone: 'bg-brand-mint' },
  { key: 'playlists', to: '/playlists/submit', icon: ListVideo, tone: 'bg-brand-orange' },
];

const RECOGNIZED_PROVIDERS = PROVIDERS.filter((provider): provider is Exclude<(typeof PROVIDERS)[number], 'web'> => provider !== 'web');

export function HomeHero({ counts }: HomeHeroProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<NotebookMode>('explore');
  const [search, setSearch] = useState('');
  const [suggestUrl, setSuggestUrl] = useState('');
  const [suggestError, setSuggestError] = useState(false);

  const exploreTabRef = useRef<HTMLButtonElement>(null);
  const suggestTabRef = useRef<HTMLButtonElement>(null);
  const suggestInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusSuggestInput = useRef(false);

  useEffect(() => {
    if (mode === 'suggest' && shouldFocusSuggestInput.current) {
      shouldFocusSuggestInput.current = false;
      suggestInputRef.current?.focus();
    }
  }, [mode]);

  const quickPromptsRaw = t('home.hero.quickPrompts', { returnObjects: true });
  const quickPrompts = Array.isArray(quickPromptsRaw)
    ? quickPromptsRaw.filter((item): item is string => typeof item === 'string')
    : [];

  const recognition = useMemo(() => (suggestUrl.trim() ? recognizeUrl(suggestUrl) : null), [suggestUrl]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    // Search across the entire library (videos, modules, documents, external references).
    navigate(term ? `/resources?search=${encodeURIComponent(term)}` : '/resources');
  }

  function runQuickPrompt(prompt: string) {
    navigate(`/resources?search=${encodeURIComponent(prompt)}`);
  }

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = suggestUrl.trim();
    if (!trimmed) {
      navigate('/suggest');
      return;
    }
    const parsed = recognizeUrl(trimmed);
    if (!parsed) {
      setSuggestError(true);
      return;
    }
    setSuggestError(false);
    navigate(`/suggest?url=${encodeURIComponent(trimmed)}`);
  }

  function openSuggestMode() {
    shouldFocusSuggestInput.current = true;
    setMode('suggest');
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextMode: NotebookMode =
      event.key === 'Home'
        ? 'explore'
        : event.key === 'End'
          ? 'suggest'
          : mode === 'explore'
            ? 'suggest'
            : 'explore';
    setMode(nextMode);
    (nextMode === 'explore' ? exploreTabRef : suggestTabRef).current?.focus();
  }

  const hasLiveCounts = counts != null && counts.resources > 0 && counts.courses > 0;

  return (
    <section className="grid gap-10 pb-14 pt-4 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)] lg:gap-12 xl:gap-14 lg:pb-20">
      <div className="flex min-w-0 flex-col">
        <h1 className="max-w-3xl text-balance text-[2.45rem] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-6xl xl:text-[4.15rem]">
          <Trans
            i18nKey="home.title"
            components={{ mark: <mark className="box-decoration-clone bg-primary px-1.5 text-primary-foreground" /> }}
          />
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('home.description')}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" className="px-6" asChild>
            <Link to="/courses">
              <BookOpen aria-hidden="true" />
              {t('home.explore')}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-foreground bg-card px-6 hover:border-brand-cyan hover:bg-brand-cyan hover:text-ink"
            asChild
          >
            <Link to="/suggest">
              <Lightbulb aria-hidden="true" />
              {t('suggest.nav')}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="px-3 underline decoration-input underline-offset-4 hover:decoration-current"
            asChild
          >
            <Link to="/how-it-works">
              {t('home.howItWorks')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul
          aria-label={t('home.hero.featuresLabel')}
          className="mt-9 divide-y divide-input border-y border-input"
        >
          {CAMPUS_FEATURES.map(({ key, to, icon: Icon, tone }) => (
            <li key={key}>
              <Link
                to={to}
                className="group flex items-start gap-3.5 py-3.5 transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:items-center"
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center text-ink', tone)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-foreground">
                    {t(`home.hero.features.${key}.title`)}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                    {t(`home.hero.features.${key}.description`)}
                  </span>
                </span>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground sm:mt-0"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-5 font-mono text-xs text-muted-foreground">{t('home.open')}</p>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col border border-foreground border-t-4 bg-ink text-ink-foreground',
          mode === 'suggest' ? 'border-t-brand-cyan' : 'border-t-primary',
        )}
      >
        <div
          role="tablist"
          aria-label={t('home.hero.tabsLabel')}
          className="grid grid-cols-2 border-b border-ink-foreground/20"
        >
          <button
            ref={exploreTabRef}
            id="hero-tab-explore"
            type="button"
            role="tab"
            aria-selected={mode === 'explore'}
            aria-controls="hero-panel-explore"
            tabIndex={mode === 'explore' ? 0 : -1}
            onClick={() => setMode('explore')}
            onKeyDown={handleTabKeyDown}
            className={cn(
              'flex min-w-0 items-center gap-2 px-4 py-3.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6 sm:text-sm',
              mode === 'explore'
                ? 'bg-primary text-ink'
                : 'bg-ink text-ink-foreground/80 hover:bg-ink-foreground/10 hover:text-ink-foreground',
            )}
          >
            <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('home.notebook')}</span>
          </button>
          <button
            ref={suggestTabRef}
            id="hero-tab-suggest"
            type="button"
            role="tab"
            aria-selected={mode === 'suggest'}
            aria-controls="hero-panel-suggest"
            tabIndex={mode === 'suggest' ? 0 : -1}
            onClick={() => setMode('suggest')}
            onKeyDown={handleTabKeyDown}
            className={cn(
              'flex min-w-0 items-center gap-2 border-l border-ink-foreground/20 px-4 py-3.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan sm:px-6 sm:text-sm',
              mode === 'suggest'
                ? 'bg-brand-cyan text-ink'
                : 'bg-ink text-ink-foreground/80 hover:bg-ink-foreground/10 hover:text-ink-foreground',
            )}
          >
            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('suggest.nav')}</span>
          </button>
        </div>

        {mode === 'explore' ? (
          <div
            id="hero-panel-explore"
            role="tabpanel"
            aria-labelledby="hero-tab-explore"
            className="flex flex-1 flex-col"
          >
            <form role="search" onSubmit={submitSearch} className="flex flex-1 flex-col justify-center gap-5 px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="home-search" className="max-w-sm text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink-foreground sm:text-3xl">
                  {t('home.question')}
                </label>
                <span className="shrink-0 font-mono text-xs text-ink-foreground/65" aria-hidden="true">
                  FACODI/01
                </span>
              </div>

              <div className="flex border border-ink-foreground/30 bg-brand-paper focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary">
                <input
                  id="home-search"
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-ink/65 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="grid w-12 shrink-0 place-items-center border-l border-ink/20 bg-primary text-ink transition-[filter] hover:brightness-95 focus-visible:outline-none"
                  aria-label={t('home.searchButton')}
                >
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {quickPrompts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-xs text-ink-foreground/75">{t('home.hero.quickPromptsLabel')}:</span>
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => runQuickPrompt(prompt)}
                      className="border border-ink-foreground/25 bg-ink-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-ink-foreground transition-colors hover:border-primary hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="mt-auto flex flex-col gap-2.5 border-t border-ink-foreground/20 px-6 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="font-mono leading-relaxed text-ink-foreground/80 tabular-nums">
                {hasLiveCounts
                  ? t('home.hero.livePulse', {
                      resources: counts.resources.toLocaleString(i18n.language),
                      courses: counts.courses.toLocaleString(i18n.language),
                    })
                  : t('home.connect')}
              </p>
              <button
                type="button"
                onClick={openSuggestMode}
                className="inline-flex shrink-0 items-center gap-1.5 self-start font-semibold text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
              >
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('home.hero.trySuggestTab')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            id="hero-panel-suggest"
            role="tabpanel"
            aria-labelledby="hero-tab-suggest"
            className="flex flex-1 flex-col"
          >
            <form onSubmit={submitSuggestion} noValidate className="flex flex-1 flex-col justify-center gap-4 px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="hero-suggest-url" className="max-w-sm text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink-foreground sm:text-3xl">
                  {t('home.hero.suggestHeading')}
                </label>
                <span className="shrink-0 font-mono text-xs text-ink-foreground/65" aria-hidden="true">
                  FACODI/02
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink-foreground/80">{t('home.hero.suggestSubtitle')}</p>

              <div className="flex border border-ink-foreground/30 bg-brand-paper focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-brand-cyan">
                <input
                  ref={suggestInputRef}
                  id="hero-suggest-url"
                  type="url"
                  value={suggestUrl}
                  onChange={event => {
                    setSuggestUrl(event.target.value);
                    if (suggestError) setSuggestError(false);
                  }}
                  placeholder={t('home.hero.suggestPlaceholder')}
                  aria-invalid={suggestError || undefined}
                  aria-describedby={suggestError ? 'hero-suggest-error' : undefined}
                  className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-ink/60 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 border-l border-ink/20 bg-brand-cyan px-4 text-sm font-semibold text-ink transition-[filter] hover:brightness-95 focus-visible:outline-none"
                  aria-label={t('home.hero.suggestSubmit')}
                >
                  <span>{t('suggest.analyse')}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {suggestError && (
                <p id="hero-suggest-error" role="alert" className="inline-flex items-center gap-2 self-start bg-brand-coral px-2.5 py-1 text-xs font-semibold text-ink">
                  {t('suggest.urlInvalid')}
                </p>
              )}

              {!suggestError && recognition && (
                <p
                  role="status"
                  className={cn(
                    'inline-flex items-center gap-2 self-start px-2.5 py-1 text-xs font-semibold text-ink',
                    recognition.provider === 'web' ? 'bg-brand-cyan' : 'bg-brand-mint',
                  )}
                >
                  {recognition.provider === 'web' ? (
                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {recognition.provider === 'web'
                      ? t('home.hero.recognizedWeb')
                      : t('home.hero.recognizedProvider', { provider: t(`suggest.providers.${recognition.provider}`) })}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="mr-1 font-mono text-xs text-ink-foreground/75">{t('suggest.providersLabel')}:</span>
                {RECOGNIZED_PROVIDERS.map(provider => {
                  const matched = recognition?.provider === provider;
                  return (
                    <span
                      key={provider}
                      className={cn(
                        'border px-2 py-0.5 font-mono text-[11px]',
                        matched
                          ? 'border-brand-cyan bg-brand-cyan font-semibold text-ink'
                          : 'border-ink-foreground/20 bg-ink-foreground/[0.04] text-ink-foreground/80',
                      )}
                    >
                      {t(`suggest.providers.${provider}`)}
                    </span>
                  );
                })}
              </div>
            </form>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink-foreground/20 px-6 py-4 text-xs sm:px-8">
              <Link
                to="/suggest"
                className="inline-flex items-center gap-1 font-semibold text-brand-cyan underline decoration-brand-cyan/50 underline-offset-4 hover:decoration-brand-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
              >
                <span>{t('home.hero.openSuggestPage')}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                to="/playlists/submit"
                className="inline-flex items-center gap-1 text-ink-foreground/80 underline decoration-ink-foreground/40 underline-offset-4 hover:text-ink-foreground hover:decoration-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
              >
                <span>{t('suggest.playlistLink')}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
