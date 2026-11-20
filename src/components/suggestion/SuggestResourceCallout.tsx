import { useId } from 'react';
import { ArrowUpRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = { context: 'library' | 'search' | 'sequences' | 'guide'; unitId?: never }
  | { context: 'unit'; unitId: string };

const CONTEXT_FILLS: Record<Props['context'], string> = {
  library: 'bg-primary',
  search: 'bg-brand-cyan',
  sequences: 'bg-brand-pink',
  unit: 'bg-brand-orange',
  guide: 'bg-brand-mint',
};

export function SuggestResourceCallout({ context, unitId }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const to = unitId ? `/suggest?${new URLSearchParams({ unit: unitId })}` : '/suggest';

  return <section aria-labelledby={titleId} className={cn(
    'flex flex-col gap-4 border border-foreground p-5 text-brand-ink sm:flex-row sm:items-center sm:gap-5 sm:p-6',
    CONTEXT_FILLS[context],
  )}>
    <span className="grid h-11 w-11 shrink-0 place-items-center border border-brand-ink bg-brand-paper text-brand-ink" aria-hidden="true">
      <Lightbulb className="h-5 w-5" />
    </span>
    <div className="min-w-0 flex-1">
      <h2 id={titleId} className="text-lg font-semibold">{t(`suggest.invite.${context}.title`)}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-brand-ink/90">{t(`suggest.invite.${context}.description`)}</p>
    </div>
    <Button asChild className="h-auto min-h-11 max-w-full self-start whitespace-normal bg-brand-ink text-left text-ink-foreground hover:bg-brand-ink/90 sm:self-center">
      <Link to={to}>{t('suggest.nav')}<ArrowUpRight aria-hidden="true" /></Link>
    </Button>
  </section>;
}
