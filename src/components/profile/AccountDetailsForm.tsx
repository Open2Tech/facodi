import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailWarning } from 'lucide-react';
import { authErrorKey } from '@/entities/auth/authErrors';
import { useAuth } from '@/features/auth/useAuth';
import { useResendEmailChange, useUpdateAccount } from '@/features/auth/queries/useAccountMutations';
import { profileSchema } from '@/shared/lib/validation';
import { FormField } from '@/components/auth/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Values = { name: string; email: string };

export function AccountDetailsForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateAccount = useUpdateAccount();
  const resend = useResendEmailChange();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<'' | 'saved' | 'email'>('');
  const [resent, setResent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '',
      email: user?.email ?? '',
    },
  });
  const pendingEmail = user?.new_email;
  const { isDirty, isSubmitting } = form.formState;

  return <div className="space-y-6">
    {pendingEmail && <div role="status" className="flex gap-3 border border-input bg-muted p-4 text-sm">
      <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="break-words">{t('profile.emailChangePending', { email: pendingEmail, current: user?.email })}</p>
        <Button type="button" variant="link" className="mt-1 h-auto p-0" disabled={resend.isPending} onClick={async () => {
          setError(''); setResent(false);
          try { await resend.mutateAsync(pendingEmail); setResent(true); }
          catch (cause) { setError(authErrorKey(cause)); }
        }}>{t(resend.isPending ? 'common.working' : 'profile.resendEmailChange')}</Button>
        {resent && <p className="mt-1">{t('profile.emailChangeResent')}</p>}
      </div>
    </div>}
    <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async values => {
      setError(''); setSaved('');
      try {
        const { emailChangeRequested } = await updateAccount.mutateAsync(values);
        form.reset({ name: values.name.trim(), email: emailChangeRequested ? user?.email ?? '' : values.email.trim() });
        setSaved(emailChangeRequested ? 'email' : 'saved');
      } catch (cause) { setError(authErrorKey(cause)); }
      finally { updateAccount.reset(); }
    })}>
      <FormField label={t('auth.name')} hint={t('profile.nameHint')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} autoComplete="name" />}</FormField>
      <FormField label={t('auth.email')} hint={t('profile.emailHint')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
      {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
      {saved && <p role="status" className="text-sm">{t(saved === 'email' ? 'profile.emailChangeSent' : 'profile.saved')}</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={!isDirty || isSubmitting}>{t(isSubmitting ? 'common.working' : 'common.save')}</Button>
        {isDirty && !isSubmitting && <Button type="button" variant="outline" onClick={() => { form.reset(); setError(''); }}>{t('common.cancel')}</Button>}
      </div>
    </form>
  </div>;
}
