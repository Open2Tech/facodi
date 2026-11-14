import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';

export function FormField({ label, error, children }: {
  label: string; error?: string; children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}) {
  const id = useId();
  const { t } = useTranslation();
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children({ id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined })}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{t(error)}</p>}
  </div>;
}
