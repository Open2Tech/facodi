import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';

export function FormField({ label, error, hint, children }: {
  label: string; error?: string; hint?: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}) {
  const id = useId();
  const { t } = useTranslation();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
    {hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{t(error)}</p>}
  </div>;
}
