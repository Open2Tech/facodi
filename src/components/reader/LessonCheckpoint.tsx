import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LessonCheckpoint as Checkpoint } from '@/entities/course/lessonReader';

export function LessonCheckpoint({ checkpoint, language }: { checkpoint: Checkpoint; language: string }) {
  const { t } = useTranslation(undefined, { lng: language });
  const group = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<number | null>(null);
  const result = checked === null ? null : checkpoint.choices[checked];
  return <form className="rounded-lg border border-input bg-card p-5" onSubmit={event => {
    event.preventDefault();
    setChecked(selected);
  }}>
    <fieldset>
      <legend className="mb-3 max-w-prose text-lg font-bold">{checkpoint.question}</legend>
      <div className="grid gap-2">{checkpoint.choices.map((choice, i) =>
        <label key={choice.label} className="flex min-h-11 cursor-pointer items-baseline gap-3 rounded border border-input px-3 py-2 has-[:checked]:border-foreground has-[:checked]:bg-muted">
          <input type="radio" className="accent-foreground" name={group} checked={selected === i} onChange={() => { setSelected(i); setChecked(null); }} />
          <span>{choice.label}</span>
        </label>)}</div>
    </fieldset>
    <Button type="submit" variant="outline" className="mt-4" disabled={selected === null || selected === checked}>{t('reader.verify')}</Button>
    <div role="status" aria-live="polite" aria-atomic="true">
      {result && <div className="mt-4 flex items-start gap-3 border-t border-input pt-4">
        {result.correct ? <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" /> : <RotateCcw aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />}
        <div><strong>{t(result.correct ? 'reader.correct' : 'reader.revisit')}</strong><p className="mt-1 leading-relaxed">{result.explanation}</p></div>
      </div>}
    </div>
  </form>;
}
