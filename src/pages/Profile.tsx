import { useTranslation } from 'react-i18next';
import { PasswordForm } from '@/components/auth/PasswordForm';
import { AccountDetailsForm } from '@/components/profile/AccountDetailsForm';
import { ContributionSummary } from '@/components/profile/ContributionSummary';
import { PreferencesForm } from '@/components/profile/PreferencesForm';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { SessionControls } from '@/components/profile/SessionControls';
import { LegalRichText } from '@/components/legal/LegalRichText';

export default function Profile() {
  const { t } = useTranslation();
  const sections = [
    { id: 'details', accent: 'border-t-primary', title: t('profile.detailsTitle'), description: t('profile.detailsDescription'), content: <AccountDetailsForm /> },
    { id: 'security', accent: 'border-t-brand-coral', title: t('profile.securityTitle'), description: t('profile.securityDescription'), content: <>
      <PasswordForm />
      <h3 className="mb-3 mt-10 text-base font-semibold">{t('profile.sessionsTitle')}</h3>
      <SessionControls />
    </> },
    { id: 'preferences', accent: 'border-t-brand-cyan', title: t('profile.preferencesTitle'), description: t('profile.preferencesDescription'), content: <PreferencesForm /> },
    { id: 'contributions', accent: 'border-t-brand-mint', title: t('profile.contributionsTitle'), description: t('profile.contributionsDescription'), content: <ContributionSummary /> },
    { id: 'data', accent: 'border-t-brand-pink', title: t('profile.dataTitle'), description: t('profile.dataDescription'), content: <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground"><LegalRichText text={t('profile.dataText')} /></p> },
  ];
  return <>
    <header className="border-b border-foreground border-t-4 border-t-brand-cyan pb-8 pt-6">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('nav.profile')}</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">{t('profile.description')}</p>
    </header>
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,40rem)_20rem] xl:justify-between">
      <div className="min-w-0 space-y-12">
        {sections.map(({ id, accent, title, description, content }) => <ProfileSection key={id} id={id} accent={accent} title={title} description={description}>{content}</ProfileSection>)}
      </div>
      <div className="order-first lg:sticky lg:top-24 lg:order-none">
        <ProfileSummary sections={sections} />
      </div>
    </div>
  </>;
}
