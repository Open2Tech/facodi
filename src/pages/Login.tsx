import { useState } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { signupSchema, signInFormSchema } from '@/shared/lib/validation';
import { safeReturnPath } from '@/shared/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import { PageState } from '@/components/layout/PageState';

export default function Login() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [signup, setSignup] = useState(false);
  const [params] = useSearchParams();
  const next = safeReturnPath(params.get('next'));
  if (loading) return <PageState loading />;
  if (user) return <Navigate to={next} replace />;
  return <section className="mx-auto max-w-md py-5">
    <p className="mb-4 text-sm text-muted-foreground">{t('auth.campus')}</p>
    <h1 className="text-3xl font-semibold">{t(signup ? 'auth.signup' : 'auth.login')}</h1>
    <p className="mb-8 mt-4 text-muted-foreground">{t(signup ? 'auth.signupDescription' : 'auth.loginDescription')}</p>
    <LoginForm key={String(signup)} signup={signup} next={next} />
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm">
      <button type="button" className="underline underline-offset-4" onClick={() => setSignup(!signup)}>{t(signup ? 'auth.haveAccount' : 'auth.createAccount')}</button>
      <Link to="/auth/reset-password" className="underline underline-offset-4">{t('auth.forgot')}</Link>
    </div>
  </section>;
}

function LoginForm({ signup, next }: { signup: boolean; next: string }) {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signup ? signupSchema : signInFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  if (sent) return <PageState title={t('auth.checkEmail')} description={t('auth.confirmDescription')} />;
  return <form className="space-y-5" noValidate onSubmit={form.handleSubmit(async values => {
    setError('');
    try {
      const result = signup ? await signUp(values.email, values.password, values.name, next) : await signIn(values.email, values.password);
      if (result.error) setError(result.error.message);
      else if (signup && !result.data?.session) setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : t('common.error'));
    }
  })}>
    {signup && <FormField label={t('auth.name')} error={form.formState.errors.name?.message}>{props => <Input {...props} {...form.register('name')} autoComplete="name" />}</FormField>}
    <FormField label={t('auth.email')} error={form.formState.errors.email?.message}>{props => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
    <FormField label={t('auth.password')} error={form.formState.errors.password?.message}>{props => <Input {...props} {...form.register('password')} type="password" autoComplete={signup ? 'new-password' : 'current-password'} />}</FormField>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button className="w-full" disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'common.working' : signup ? 'auth.signup' : 'auth.login')}</Button>
  </form>;
}
