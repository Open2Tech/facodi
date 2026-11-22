import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CheckCheck, ChevronDown, Clapperboard, RotateCcw, ShieldCheck } from 'lucide-react';

/**
 * A tiny, optional editorial decision exercise.
 * No account, score, analytics event or persistent data is created.
 * It complements — and never replaces — the course's real study sequences.
 */
const scenarios = [
  { id: 'source', correct: 1 },
  { id: 'image', correct: 2 },
  { id: 'headline', correct: 0 },
] as const;

export function CommunicationNewsroomChallenge() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const finished = step >= scenarios.length;
  const current = scenarios[step];

  function advance() {
    setSelection(null);
    setStep(previous => previous + 1);
  }

  function restart() {
    setStep(0);
    setSelection(null);
  }

  return <details className="group mb-12 border border-foreground border-t-4 border-t-brand-pink bg-card">
    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <span className="grid h-12 w-12 shrink-0 place-items-center border border-foreground bg-brand-pink text-brand-ink" aria-hidden="true">
        <Clapperboard className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('lccNewsroom.kicker')}</span>
        <span className="block text-lg font-semibold sm:text-xl">{t('lccNewsroom.title')}</span>
        <span className="block text-sm text-muted-foreground">{t('lccNewsroom.intro')}</span>
      </span>
      <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="border-t border-input px-5 py-6">
      {finished ? <div role="status" className="max-w-3xl">
        <CheckCheck className="mb-3 h-8 w-8 text-foreground" aria-hidden="true" />
        <h3 className="text-xl font-semibold">{t('lccNewsroom.finished')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('lccNewsroom.finishText')}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/sequences/facodi-lcc-pt-literacia-desinformacao-portugal"
            className="inline-flex min-h-11 items-center border border-foreground bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-ink hover:brightness-95">
            {t('lccNewsroom.exploreSequence')}
          </Link>
          <button type="button" onClick={restart}
            className="inline-flex min-h-11 items-center gap-2 border border-input px-4 py-2 text-sm font-semibold hover:bg-muted">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{t('lccNewsroom.restart')}
          </button>
        </div>
      </div> : current && <>
        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('lccNewsroom.progress', { current: step + 1, total: scenarios.length })}
        </p>
        <h3 className="mt-3 max-w-3xl text-xl font-semibold leading-snug" id="lcc-newsroom-question">
          {t(`lccNewsroom.scenarios.${current.id}.question`)}
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3" role="group" aria-labelledby="lcc-newsroom-question">
          {[0, 1, 2].map(choice => <button
            key={choice}
            type="button"
            disabled={selection !== null}
            aria-pressed={selection === choice}
            onClick={() => setSelection(choice)}
            className={`min-h-16 border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selection === choice ? 'border-foreground bg-brand-mint text-brand-ink' : 'border-input bg-background hover:border-foreground hover:bg-muted'} disabled:cursor-default`}>
            {t(`lccNewsroom.scenarios.${current.id}.choices.${choice}`)}
          </button>)}
        </div>
        {selection !== null && <div role="status" aria-live="polite" className="mt-5 max-w-3xl border-l-4 border-foreground bg-muted p-4">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t(selection === current.correct ? 'lccNewsroom.right' : 'lccNewsroom.tryNext')}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{t(`lccNewsroom.scenarios.${current.id}.explanation`)}</p>
          <button type="button" onClick={advance}
            className="mt-4 min-h-11 border border-foreground bg-primary px-4 py-2 text-sm font-semibold text-brand-ink hover:brightness-95">
            {t(step === scenarios.length - 1 ? 'lccNewsroom.finish' : 'lccNewsroom.next')}
          </button>
        </div>}
      </>}
    </div>
  </details>;
}
