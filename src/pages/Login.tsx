import { useState } from 'react';
import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authErrorKey } from '@/entities/auth/authErrors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { resendSignupConfirmation, signInWithGoogle } from '@/entities/auth/auth.api';
import { signupSchema, signInFormSchema } from '@/shared/lib/validation';
import { safeReturnPath } from '@/shared/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/components/auth/FormField';
import { PageState } from '@/components/layout/PageState';
import { AuthShell } from '@/components/auth/AuthShell';
import { LegalRichText } from '@/components/legal/LegalRichText';

export default function Login() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [signup, setSignup] = useState(false);
  const [params] = useSearchParams();
  const next = safeReturnPath(params.get('next'));
  const suggesting = next.split(/[?#]/, 1)[0] === '/suggest';
  if (loading) return <PageState loading />;
  if (user) return <Navigate to={next} state={location.state} replace />;
  return <AuthShell>
    <h1 className="text-3xl font-semibold">{t(signup ? 'auth.signup' : 'auth.login')}</h1>
    <p className="mb-8 mt-4 text-muted-foreground">
      {t(suggesting ? 'suggest.signInDescription' : signup ? 'auth.signupDescription' : 'auth.loginDescription')}
    </p>
    <LoginForm key={String(signup)} signup={signup} next={next} />
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm">
      <button type="button" className="underline underline-offset-4" onClick={() => setSignup(!signup)}>{t(signup ? 'auth.haveAccount' : 'auth.createAccount')}</button>
      <Link to="/auth/reset-password" className="underline underline-offset-4">{t('auth.forgot')}</Link>
    </div>
  </AuthShell>;
}

function LoginForm({ signup, next }: { signup: boolean; next: string }) {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signup ? signupSchema : signInFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  if (sent) return <div className="space-y-5">
    <PageState title={t('auth.checkEmail')} description={t('auth.confirmDescription')} />
    <p className="break-all text-center text-sm text-muted-foreground">{form.getValues('email')}</p>
    {resent && <p role="status" className="text-sm">{t('auth.resendSent')}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
    <Button type="button" variant="outline" className="w-full" disabled={resending}
      onClick={async () => {
        setError('');
        setResent(false);
        setResending(true);
        try {
          await resendSignupConfirmation(form.getValues('email'), next);
          setResent(true);
        } catch (reason) {
          setError(authErrorKey(reason));
        } finally {
          setResending(false);
        }
      }}>
      {t(resending ? 'common.working' : 'auth.resendConfirmation')}
    </Button>
  </div>;
  const busy = googlePending || form.formState.isSubmitting;
  return <div className="flex flex-col gap-5">
    <Button type="button" variant="outline" className="w-full" disabled={busy}
      aria-busy={googlePending} onClick={async () => {
        setError('');
        setGooglePending(true);
        try {
          await signInWithGoogle(next);
        } catch (reason) {
          setError(authErrorKey(reason));
          setGooglePending(false);
        }
      }}>
      <img src="/media/auth/google.svg" alt="" width={18} height={18} className="size-[18px] shrink-0" />
      <span className="normal-case font-medium tracking-normal">{t(googlePending ? 'auth.googleRedirecting' : 'auth.continueWithGoogle')}</span>
    </Button>
    <div className="flex items-center gap-3">
      <Separator className="min-w-0 flex-1" />
      <span className="text-sm text-muted-foreground">{t('auth.orWithEmail')}</span>
      <Separator className="min-w-0 flex-1" />
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
    <form className="flex flex-col gap-5" noValidate onSubmit={form.handleSubmit(async values => {
      if (busy) return;
      setError('');
      try {
        const result = signup ? await signUp(values.email, values.password, values.name, next) : await signIn(values.email, values.password);
        if (result.error) setError(authErrorKey(result.error));
        else if (signup && !result.data?.session) setSent(true);
      } catch (error) {
        setError(authErrorKey(error));
      }
    })}>
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5">
        {signup && <FormField label={t('auth.name')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} autoComplete="name" />}</FormField>}
        <FormField label={t('auth.email')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
        <FormField label={t('auth.password')} error={form.formState.errors.password?.message}>{props => <Input {...props} {...form.register('password')} type="password" autoComplete={signup ? 'new-password' : 'current-password'} />}</FormField>
        <Button className="w-full" disabled={busy}>{t(form.formState.isSubmitting ? 'common.working' : signup ? 'auth.signup' : 'auth.login')}</Button>
      </fieldset>
    </form>
    <p className="text-sm text-muted-foreground"><LegalRichText text={t('auth.legalNotice')} /></p>
  </div>;
}
