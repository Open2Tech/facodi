import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { setRememberPreferences, useRememberPreferences } from '@/shared/lib/preferenceStorage';
import { cn } from '@/lib/utils';

/** Opt-in to persist language and theme across visits; off by default. */
export function RememberPreferences({ className }: { className?: string }) {
  const { t } = useTranslation();
  const remember = useRememberPreferences();
  const id = useId();
  return <div className={cn('flex items-start gap-4 border border-input p-5 transition-colors has-[:focus-visible]:border-foreground', remember && 'border-foreground', className)}>
    <Checkbox id={id} checked={remember} onCheckedChange={checked => setRememberPreferences(checked === true)} aria-describedby={`${id}-description`}
      className="mt-0.5 h-5 w-5 rounded-none border-foreground [&_svg]:h-3.5 [&_svg]:w-3.5" />
    <div className="space-y-1.5">
      <label htmlFor={id} className="cursor-pointer font-semibold leading-snug">{t('preferences.rememberLabel')}</label>
      <p id={`${id}-description`} className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        {t(remember ? 'preferences.rememberOn' : 'preferences.rememberOff')}
      </p>
    </div>
  </div>;
}
