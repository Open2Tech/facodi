import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authErrorKey } from '@/entities/auth/authErrors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuthLink } from '@/features/auth/useAuthLink';
import { useRequestPasswordReset } from '@/features/auth/queries/useAccountMutations';
import { resetRequestSchema } from '@/shared/lib/validation';
import { useAuth } from '@/features/auth/useAuth';
import { FormField } from '@/components/auth/FormField';
import { PasswordForm } from '@/components/auth/PasswordForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ResetPassword() {
  const { t } = useTranslation();
  const { state, hasLink } = useAuthLink(false);
  const { user, loading } = useAuth();
  const requestPasswordReset = useRequestPasswordReset();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const form = useForm<{ email: string }>({ resolver: zodResolver(resetRequestSchema), defaultValues: { email: '' } });
  if (state === 'pending' || loading) return <PageState loading />;
  return <AuthShell>
    <h1 className="mb-7 text-3xl font-semibold">{t('auth.reset')}</h1>
    {hasLink && state === 'ready' && user ? <PasswordForm /> : <>
      {state === 'invalid' && <p role="alert" className="mb-6 text-destructive">{t('auth.error.invalidLink')}</p>}
      <p className="mb-6 text-muted-foreground">{t('auth.resetDescription')}</p>
      <form className="space-y-5" noValidate onSubmit={form.handleSubmit(async values => {
        setError(''); setSent(false);
        try { await requestPasswordReset.mutateAsync(values.email); setSent(true); }
        catch (error) { setError(authErrorKey(error)); }
        finally { requestPasswordReset.reset(); }
      })}>
        <FormField label={t('auth.email')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
        {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
        {sent && <p role="status" className="text-sm">{t('auth.resetSent')}</p>}
        <Button disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'common.working' : 'auth.sendReset')}</Button>
      </form>
    </>}
    <Link className="mt-8 inline-block text-sm underline underline-offset-4" to="/login">{t('auth.login')}</Link>
  </AuthShell>;
}
