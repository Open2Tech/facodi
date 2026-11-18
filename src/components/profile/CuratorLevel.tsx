import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import { useMySuggestions } from '@/features/suggestions/queries/useSuggestions';
import { useMyPlaylists } from '@/features/contributions/queries/useContributions';
import { approvedContributions, curatorLevel } from '@/entities/contribution/curatorLevel';
import { cn } from '@/lib/utils';

/** Curation level on the profile, from the same suggestion and playlist histories shown below it. */
export function CuratorLevel() {
  const suggestions = useMySuggestions();
  const playlists = useMyPlaylists();
  if (!suggestions.data || !playlists.data) return null;
  return <CuratorLevelView {...curatorLevel(approvedContributions(suggestions.data, playlists.data))} />;
}

export function CuratorLevelView({ approved, level, next }: ReturnType<typeof curatorLevel>) {
  const { t } = useTranslation();
  return <section aria-labelledby="curator-level" className="mb-10 grid gap-4 border border-foreground p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
    <span className={cn('grid h-14 w-14 place-items-center border border-foreground', level ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')} aria-hidden="true">
      <Award className="h-7 w-7" strokeWidth={1.75} />
    </span>
    <div className="min-w-0">
      <h3 id="curator-level" className="text-sm font-medium text-muted-foreground">{t('curatorLevel.title')}</h3>
      <p className="mt-1 text-xl font-semibold">
        {level ? t('curatorLevel.levelName', { number: level.number, name: t(`curatorLevel.levels.${level.key}`) }) : t('curatorLevel.none')}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('curatorLevel.approved', { count: approved })}
        {' · '}
        {next ? t('curatorLevel.next', { count: next.remaining, name: t(`curatorLevel.levels.${next.key}`) }) : t('curatorLevel.top')}
      </p>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t('curatorLevel.explain')}</p>
    </div>
  </section>;
}
