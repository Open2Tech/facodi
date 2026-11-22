import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Award, Check, ChevronDown, Compass, Flag, Sparkles, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { discoveryLinks } from '@/features/discoveries/catalog';
import { discoveryMilestones } from '@/features/discoveries/milestones';
import { useDiscoveries } from '@/features/discoveries/useDiscoveries';
import { cn } from '@/lib/utils';

const stampIcons = { first: Flag, curious: Sparkles, explorer: Compass, complete: Trophy };

export function DiscoveryAlbum({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { hash, key } = useLocation();
  const album = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [pendingOnly, setPendingOnly] = useState(false);
  const found = useDiscoveries();
  const total = discoveryLinks.length;
  const next = discoveryLinks.find(({ id }) => !found.has(id));
  const visible = pendingOnly ? discoveryLinks.filter(({ id }) => !found.has(id)) : discoveryLinks;

  useEffect(() => {
    if (hash !== '#discoveries' || !album.current) return;
    album.current.open = true;
    const frame = requestAnimationFrame(() => {
      summary.current?.focus({ preventScroll: true });
      summary.current?.scrollIntoView?.({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);

  return <details id="discoveries" ref={album} className={cn('group border border-foreground bg-card', className)}>
    <summary ref={summary} className="flex min-h-12 cursor-pointer list-none scroll-mt-24 items-center justify-between gap-3 px-4 py-3 hover:bg-muted focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <Compass className="size-5 shrink-0" aria-hidden="true" />
        <span className="font-semibold">{t('discoveries.title')}</span>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{t('discoveries.progress', { found: found.size, total })}</span>
      </span>
      <ChevronDown className="size-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="border-t border-input p-4 sm:p-5">
      <p className="max-w-prose text-sm text-muted-foreground">{t(next ? 'discoveries.description' : 'discoveries.complete')}</p>
      <progress aria-label={t('discoveries.title')} value={found.size} max={total} className="mt-3 block h-2.5 w-full appearance-none border border-foreground bg-background [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-background [&::-webkit-progress-value]:bg-primary" />
      <ol aria-label={t('discoveries.stampsLabel')} className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {discoveryMilestones.map(({ id, target }) => {
          const earned = found.size >= target;
          const Icon = stampIcons[id];
          return <li key={id} className={cn('flex flex-col gap-2 border p-3 text-sm',
            earned ? 'border-foreground bg-brand-mint text-brand-ink' : 'border-input bg-muted text-muted-foreground')}>
            <div className="flex items-center justify-between gap-2">
              <Icon className="size-6" aria-hidden="true" />
              {earned && <Award className="size-4" aria-hidden="true" />}
            </div>
            <span className="font-semibold">{t(`discoveries.stamps.${id}`)}</span>
            <span className="text-xs">{t('discoveries.stampTarget', { count: target })}</span>
            <span className="sr-only">{t(earned ? 'discoveries.earned' : 'discoveries.locked')}</span>
          </li>;
        })}
      </ol>
      {!next && <p className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <Trophy className="size-5 shrink-0" aria-hidden="true" />{t('discoveries.revisit')}
      </p>}
      {next && <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link to={next.to} className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-primary px-3 text-sm font-semibold text-brand-ink hover:brightness-95 focus-visible:outline-ring">
          {t('discoveries.nextHint')}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={pendingOnly} onChange={event => setPendingOnly(event.target.checked)} className="size-4 accent-primary" />
          {t('discoveries.pendingOnly')}
        </label>
      </div>}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {(next ? visible : discoveryLinks).map(({ id, to }) => {
          const unlocked = found.has(id);
          return <li key={id}>
            <Link to={to} className={cn('flex min-h-14 items-center gap-3 border px-3 py-2 text-sm hover:underline focus-visible:outline-ring',
              unlocked ? 'border-foreground bg-brand-mint text-brand-ink' : 'border-input bg-background hover:bg-muted')}>
              {unlocked ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />}
              <span>{t(`discoveries.hints.${id}`)}{unlocked && <span className="sr-only"> — {t('discoveries.found')}</span>}</span>
            </Link>
          </li>;
        })}
      </ul>
    </div>
  </details>;
}
