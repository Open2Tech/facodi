import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/useAuth';
import { useUpdateAccount } from '@/features/auth/queries/useAccountMutations';
import { profileSchema } from '@/shared/lib/validation';
import { FormField } from '@/components/auth/FormField';
import { PasswordForm } from '@/components/auth/PasswordForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateAccount = useUpdateAccount();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const form = useForm<{ name: string; email: string }>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '',
      email: user?.email ?? '',
    },
  });
  return <div className="max-w-xl">
    <h1 className="text-3xl font-semibold">{t('nav.profile')}</h1><p className="mb-8 mt-4 text-muted-foreground">{t('profile.description')}</p>
    <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async values => {
      setError(''); setSaved(false);
      try { await updateAccount.mutateAsync(values); setSaved(true); }
      catch (error) { setError(error instanceof Error ? error.message : t('common.error')); }
      finally { updateAccount.reset(); }
    })}>
      <FormField label={t('auth.name')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} autoComplete="name" />}</FormField>
      <FormField label={t('auth.email')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm">{t('profile.saved')}</p>}
      <Button disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'common.working' : 'common.save')}</Button>
    </form>
    <section className="mt-12 border-t border-input pt-8"><h2 className="mb-6 text-xl font-semibold">{t('auth.savePassword')}</h2><PasswordForm /></section>
  </div>;
}
