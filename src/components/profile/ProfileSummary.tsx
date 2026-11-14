import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, KeyRound, Mail, MailCheck, MailWarning, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { displayName, initials, signInProviders } from '@/components/profile/accountFacts';

export function ProfileSummary({ sections }: { sections: { id: string; title: string }[] }) {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const name = displayName(user);
  const date = (value?: string | null, time = false) => value
    ? new Intl.DateTimeFormat(i18n.language, time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'long' }).format(new Date(value))
    : '';
  const providers = signInProviders(user).map(provider => t(`profile.provider.${provider}`, { defaultValue: provider }));
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: ShieldCheck, label: t('dashboard.role'), value: t(`roles.${role}`) },
    { icon: user?.email_confirmed_at ? MailCheck : Mail, label: t('auth.email'), value: t(user?.email_confirmed_at ? 'profile.emailConfirmed' : 'profile.emailPending') },
    ...(user?.new_email ? [{ icon: MailWarning, label: t('profile.newEmail'), value: user.new_email }] : []),
    ...(providers.length ? [{ icon: KeyRound, label: t('profile.signInMethod'), value: providers.join(', ') }] : []),
    ...(user?.created_at ? [{ icon: CalendarDays, label: t('profile.memberSince'), value: date(user.created_at) }] : []),
    ...(user?.last_sign_in_at ? [{ icon: Clock, label: t('profile.lastSignIn'), value: date(user.last_sign_in_at, true) }] : []),
  ];
  return <aside aria-labelledby="profile-summary" className="border border-input">
    <div className="flex items-center gap-4 border-b border-input p-5">
      <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center border border-foreground bg-primary text-xl font-bold text-ink">{initials(name) || '·'}</span>
      <div className="min-w-0">
        <h2 id="profile-summary" className="sr-only">{t('profile.summary')}</h2>
        <p className="break-words font-semibold">{name}</p>
        {user?.email && name !== user.email && <p className="break-all text-sm text-muted-foreground">{user.email}</p>}
      </div>
    </div>
    <dl className="divide-y divide-input text-sm">
      {facts.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-start gap-3 px-5 py-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="ml-auto min-w-0 break-words text-right font-medium tabular-nums">{value}</dd>
      </div>)}
    </dl>
    <nav aria-label={t('profile.onThisPage')} className="hidden border-t border-input p-5 lg:block">
      <p className="mb-2 text-sm font-semibold">{t('profile.onThisPage')}</p>
      <ul className="space-y-1 text-sm">
        {sections.map(section => <li key={section.id}>
          <a href={`#${section.id}`} className="block py-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{section.title}</a>
        </li>)}
      </ul>
    </nav>
  </aside>;
}
