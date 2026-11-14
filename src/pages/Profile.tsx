import { useState } from 'react';
import { CalendarDays, Mail, MailCheck, ShieldCheck } from 'lucide-react';
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
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
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
  const name = typeof user?.user_metadata.full_name === 'string' && user.user_metadata.full_name.trim() ? user.user_metadata.full_name.trim() : user?.email ?? '';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  const joined = user?.created_at ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(user.created_at)) : '';
  const facts = [
    { icon: ShieldCheck, label: t('dashboard.role'), value: t(`roles.${role}`) },
    { icon: user?.email_confirmed_at ? MailCheck : Mail, label: t('auth.email'), value: t(user?.email_confirmed_at ? 'profile.emailConfirmed' : 'profile.emailPending') },
    ...(joined ? [{ icon: CalendarDays, label: t('profile.memberSince'), value: joined }] : []),
  ];
  return <div className="grid gap-12 lg:grid-cols-[minmax(0,36rem)_minmax(0,20rem)] lg:justify-between">
    <div className="min-w-0">
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
    </div>
    <aside aria-labelledby="profile-summary" className="order-first border border-input lg:order-none lg:self-start">
      <div className="flex items-center gap-4 border-b border-input p-5">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center border border-foreground bg-primary text-xl font-bold text-ink">{initials || '·'}</span>
        <div className="min-w-0">
          <h2 id="profile-summary" className="sr-only">{t('profile.summary')}</h2>
          <p className="break-words font-semibold">{name}</p>
          {user?.email && name !== user.email && <p className="break-all text-sm text-muted-foreground">{user.email}</p>}
        </div>
      </div>
      <dl className="divide-y divide-input text-sm">
        {facts.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 px-5 py-3">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="ml-auto text-right font-medium">{value}</dd>
        </div>)}
      </dl>
    </aside>
  </div>;
}
