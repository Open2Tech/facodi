import { useTranslation } from 'react-i18next';
import { useMyPlaylists } from '@/features/contributions/queries/useContributions';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { PageState } from '@/components/layout/PageState';

/** The signed-in user's latest playlist proposals with their review state. */
export function PlaylistHistory() {
  const { t, i18n } = useTranslation();
  const mine = useMyPlaylists();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  if (mine.isPending) return <PageState loading />;
  if (mine.error) return <PageState level="h3" title={t('common.error')} description={mine.error.message} retry={() => void mine.refetch()} />;
  if (!mine.data.length) return <p className="mt-4 text-sm text-muted-foreground">{t('playlistSubmit.historyEmpty')}</p>;
  return <ul className="mt-5 divide-y divide-input border-y border-input">
    {mine.data.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[item.courses?.code, item.curricular_units?.title].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <time dateTime={item.submitted_at}>{t('playlistSubmit.submittedOn', { date: dateFormat.format(new Date(item.submitted_at)) })}</time>
        </p>
        {item.review_note && <p className="mt-2 max-w-prose text-sm">{t('studyReview.previousNote')}: {item.review_note}</p>}
      </div>
      <StatusBadge status={item.status} label={t(`playlistSubmit.status.${item.status}`, { defaultValue: item.status })} />
    </li>)}
  </ul>;
}
