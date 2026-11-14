import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { createPasswordConfirmationSchema } from '@/shared/lib/validation';
import { authErrorKey } from '@/entities/auth/authErrors';
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
  const [visible, setVisible] = useState(false);
  const form = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' },
  });
  const type = visible ? 'text' : 'password';
  return <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async values => {
    setError(''); setSaved(false);
    try { await updateUserPassword.mutateAsync(values.password); form.reset(); setVisible(false); setSaved(true); onSuccess?.(); }
    catch (error) { setError(authErrorKey(error)); }
    finally { updateUserPassword.reset(); }
  })}>
    <FormField label={t('auth.newPassword')} hint={t('auth.passwordHint')} error={form.formState.errors.password?.message}>{props => <Input {...props} {...form.register('password')} type={type} autoComplete="new-password" />}</FormField>
    <FormField label={t('auth.confirmPassword')} error={form.formState.errors.confirmPassword?.message}>{props => <Input {...props} {...form.register('confirmPassword')} type={type} autoComplete="new-password" />}</FormField>
    <div><button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}
      className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      {t(visible ? 'auth.hidePasswords' : 'auth.showPasswords')}
    </button></div>
    {error && <div role="alert" className="text-sm text-destructive">
      <p>{t(error)}</p>
      {error === 'auth.error.reauthenticationNeeded' && <Link to="/auth/reset-password" className="mt-1 inline-block font-semibold text-foreground underline underline-offset-4">{t('auth.sendReset')}</Link>}
    </div>}
    {saved && <p role="status" className="text-sm">{t('auth.passwordSaved')}</p>}
    <Button disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'common.working' : 'auth.savePassword')}</Button>
  </form>;
}
