import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPasswordConfirmationSchema } from '@/shared/lib/validation';
import { useUpdatePassword } from '@/features/auth/queries/useAccountMutations';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = createPasswordConfirmationSchema();
export function PasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const updateUserPassword = useUpdatePassword();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const form = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' },
  });
  return <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async values => {
    setError(''); setSaved(false);
    try { await updateUserPassword.mutateAsync(values.password); form.reset(); setSaved(true); onSuccess?.(); }
    catch (error) { setError(error instanceof Error ? error.message : t('common.error')); }
    finally { updateUserPassword.reset(); }
  })}>
    <FormField label={t('auth.newPassword')} error={form.formState.errors.password?.message}>{props => <Input {...props} {...form.register('password')} type="password" autoComplete="new-password" />}</FormField>
    <FormField label={t('auth.confirmPassword')} error={form.formState.errors.confirmPassword?.message}>{props => <Input {...props} {...form.register('confirmPassword')} type="password" autoComplete="new-password" />}</FormField>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {saved && <p role="status" className="text-sm">{t('auth.passwordSaved')}</p>}
    <Button disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'common.working' : 'auth.savePassword')}</Button>
  </form>;
}
