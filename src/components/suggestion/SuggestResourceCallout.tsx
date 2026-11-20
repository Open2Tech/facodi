import { useId } from 'react';
import { ArrowUpRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type Props = { context: 'library' | 'search' | 'sequences' | 'guide'; unitId?: never }
  | { context: 'unit'; unitId: string };

export function SuggestResourceCallout({ context, unitId }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const to = unitId ? `/suggest?${new URLSearchParams({ unit: unitId })}` : '/suggest';

  return <section aria-labelledby={titleId} className="flex flex-col gap-4 border border-input border-l-4 border-l-primary bg-card p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
    <Lightbulb className="h-6 w-6 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <h2 id={titleId} className="text-lg font-semibold">{t(`suggest.invite.${context}.title`)}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t(`suggest.invite.${context}.description`)}</p>
    </div>
    <Button asChild variant="outline" className="h-auto min-h-11 max-w-full self-start whitespace-normal text-left sm:self-center">
      <Link to={to}>{t('suggest.nav')}<ArrowUpRight aria-hidden="true" /></Link>
    </Button>
  </section>;
}
