import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { parseScreening } from '@/entities/suggestion/suggestion.api';
import { useMySuggestions } from '@/features/suggestions/queries/useSuggestions';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { PageState } from '@/components/layout/PageState';
import { RecommendationBadge } from '@/components/suggestion/RecommendationBadge';

/** The signed-in learner's latest suggestions; only they and editors can read them. */
export function SuggestionHistory() {
  const { t, i18n } = useTranslation();
  const mine = useMySuggestions();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  if (mine.isPending) return <PageState loading />;
  if (mine.error) return <PageState level="h3" title={t('common.error')} description={mine.error.message} retry={() => void mine.refetch()} />;
  if (!mine.data.length) return <p className="mt-4 text-sm text-muted-foreground">{t('suggest.historyEmpty')}</p>;
  return <ul className="mt-4 divide-y divide-input border-y border-input">
    {mine.data.map(item => {
      const screening = parseScreening(item.screening);
      const unit = item.curricular_units;
      return <li key={item.id} className="py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="min-w-0 flex-1 break-words font-medium">{item.title}</p>
          <StatusBadge status={item.status} label={t(`suggest.status.${item.status}`, { defaultValue: item.status })} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`suggest.providers.${item.provider}`, { defaultValue: item.provider })}
          {unit && <> · {unit.courses
            ? <Link className="underline underline-offset-4" to={`/courses/${encodeURIComponent(unit.courses.slug)}/units/${encodeURIComponent(unit.slug)}`}>{unit.title}</Link>
            : unit.title}</>}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(item.status === 'pending' || item.status === 'duplicate') && <RecommendationBadge recommendation={screening.recommendation} />}
          <time dateTime={item.created_at} className="text-xs text-muted-foreground">{t('suggest.submittedOn', { date: dateFormat.format(new Date(item.created_at)) })}</time>
        </div>
        {item.review_note && <p className="mt-2 max-w-prose text-sm">{t('suggest.reviewNote')}: {item.review_note}</p>}
      </li>;
    })}
  </ul>;
}
