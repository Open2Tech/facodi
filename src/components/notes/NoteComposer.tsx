import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Bold, Braces, Check, Code, Italic, Timer, X, type LucideIcon } from 'lucide-react';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatTimestamp, parseTags, type NoteDraft, type StudyNote } from '@/entities/notes/notes';
import { noteSchema, type NoteFormValues } from '@/shared/lib/validation';

type Format = { key: string; icon: LucideIcon; before: string; after: string };
const FORMATS: Format[] = [
  { key: 'bold', icon: Bold, before: '**', after: '**' },
  { key: 'italic', icon: Italic, before: '*', after: '*' },
  { key: 'code', icon: Code, before: '`', after: '`' },
  { key: 'codeBlock', icon: Braces, before: '```\n', after: '\n```' },
];

/**
 * Writes a new note or edits one. While the video plays, a new note is tied to the moment the
 * learner starts writing; the stamp can be moved to the current moment or removed.
 */
export function NoteComposer({ note, playerTime, timed, onSubmit, onCancel }: {
  note?: StudyNote;
  playerTime: number | null;
  /** Whether this resource has a player at all; documents and links never carry stamps. */
  timed: boolean;
  onSubmit: (draft: NoteDraft) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [timestamp, setTimestamp] = useState<number | null>(note?.timestamp ?? null);
  const body = useRef<HTMLTextAreaElement | null>(null);
  // Tie a new note to the moment only once per draft, so a removed mark stays removed.
  const autoStamped = useRef(Boolean(note));
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: note?.title ?? '', tags: note?.tags.map(tag => `#${tag}`).join(' ') ?? '', body: note?.body ?? '' },
  });
  const { errors } = form.formState;
  const bodyField = form.register('body');

  function captureMoment() {
    if (autoStamped.current || playerTime === null) return;
    autoStamped.current = true;
    setTimestamp(playerTime);
  }

  function applyFormat({ before, after }: Format) {
    const element = body.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end, value } = element;
    const next = `${value.slice(0, start)}${before}${value.slice(start, end)}${after}${value.slice(end)}`;
    form.setValue('body', next, { shouldDirty: true });
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, end + before.length);
    });
  }

  const submit = form.handleSubmit(async values => {
    const saved = await onSubmit({ title: values.title.trim(), body: values.body.trim(), tags: parseTags(values.tags), timestamp: timed ? timestamp : null });
    if (saved && !note) {
      form.reset({ title: '', tags: '', body: '' });
      setTimestamp(null);
      autoStamped.current = false;
      setJustSaved(true);
    }
  });

  return <form noValidate onSubmit={event => void submit(event)} onFocusCapture={captureMoment} className="space-y-4">
    <div className="space-y-4">
      <FormField label={t('notes.fieldTitle')} error={errors.title?.message}>
        {props => <Input {...props} autoComplete="off" placeholder={t('notes.titlePlaceholder')} {...form.register('title')} />}
      </FormField>
      <FormField label={t('notes.fieldTags')} error={errors.tags?.message}>
        {props => <Input {...props} autoComplete="off" placeholder={t('notes.tagsPlaceholder')} {...form.register('tags')} />}
      </FormField>
    </div>

    <FormField label={t('notes.fieldBody')} error={errors.body?.message} hint={t('notes.bodyHint')}>
      {props => <div className="border border-input focus-within:border-foreground">
        <div role="toolbar" aria-label={t('notes.toolbar')} className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/60 p-1">
          {FORMATS.map(format => <button key={format.key} type="button" onClick={() => applyFormat(format)} title={t(`notes.format.${format.key}`)} aria-label={t(`notes.format.${format.key}`)}
            className="grid h-8 w-8 place-items-center transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <format.icon className="h-4 w-4" aria-hidden="true" />
          </button>)}
          {timed && <span className="ml-auto flex items-center gap-1">
            {timestamp !== null && <span className="inline-flex items-center border border-foreground bg-primary font-mono text-xs tabular-nums text-primary-foreground">
              <span className="inline-flex items-center gap-1 px-2 py-1"><Timer className="h-3.5 w-3.5" aria-hidden="true" />{formatTimestamp(timestamp)}</span>
              <button type="button" onClick={() => setTimestamp(null)} aria-label={t('notes.removeStamp', { time: formatTimestamp(timestamp) })}
                className="grid h-7 w-7 place-items-center border-l border-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
            </span>}
            {playerTime !== null && playerTime !== timestamp && <button type="button" onClick={() => setTimestamp(playerTime)}
              className="inline-flex h-8 items-center gap-1 px-2 font-mono text-xs tabular-nums transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />{t('notes.markNow', { time: formatTimestamp(playerTime) })}
            </button>}
          </span>}
        </div>
        <Textarea {...props} {...bodyField} ref={element => { bodyField.ref(element); body.current = element; }} rows={note ? 5 : 4}
          placeholder={t('notes.bodyPlaceholder')} className="min-h-24 resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void submit(); } }} />
      </div>}
    </FormField>

    <div className="flex flex-wrap items-center justify-end gap-3">
      <p role="status" className="mr-auto text-xs text-muted-foreground">
        {justSaved ? <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><Check className="h-3.5 w-3.5" aria-hidden="true" />{t('notes.saved')}</span> : t('notes.shortcut')}
      </p>
      {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>}
      <Button type="submit" disabled={form.formState.isSubmitting}>{t(note ? 'common.save' : 'notes.save')}</Button>
    </div>
  </form>;
}
