import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BookOpen, Lightbulb, PenSquare, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { NotebookOverview } from '@/components/notes/NotebookOverview';
import { SequenceOverview } from '@/components/sequence/SequenceOverview';
import { StudyMilestones } from '@/components/sequence/StudyMilestones';
import { ContinueLearning } from '@/components/sequence/ContinueLearning';
import { MonthlyChallenge } from '@/components/sequence/MonthlyChallenge';
import { MyCourse } from '@/components/dashboard/MyCourse';
import { IfesProgressOverview } from '@/components/course/IfesProgressOverview';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const name = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  const links: { to: string; title: string; description: string; icon: LucideIcon; fill: string; hoverTint: string }[] = [
    { to: '/courses', title: t('nav.courses'), description: t('dashboard.catalog'), icon: BookOpen, fill: 'bg-primary', hoverTint: 'hover:bg-primary/15' },
    { to: '/profile', title: t('nav.profile'), description: t('dashboard.account'), icon: UserRound, fill: 'bg-brand-cyan', hoverTint: 'hover:bg-brand-cyan/15' },
    { to: '/suggest#suggest-history', title: t('suggest.history'), description: t('dashboard.suggestions'), icon: Lightbulb, fill: 'bg-brand-orange', hoverTint: 'hover:bg-brand-orange/15' },
    ...(canAccessFacodiRoute(role, 'editor') ? [{ to: '/editor', title: t('nav.editor'), description: t('dashboard.editor'), icon: PenSquare, fill: 'bg-brand-mint', hoverTint: 'hover:bg-brand-mint/15' }] : []),
    ...(role === 'admin' ? [{ to: '/admin', title: t('nav.admin'), description: t('dashboard.admin'), icon: ShieldCheck, fill: 'bg-brand-coral', hoverTint: 'hover:bg-brand-coral/15' }] : []),
  ];
  return <>
    <header className="border border-foreground border-t-4 border-t-primary bg-card p-6 sm:p-8">
      <h1 className="break-words text-4xl font-semibold">{name ? t('dashboard.welcome', { name }) : t('dashboard.welcomeAnonymous')}</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">{t('dashboard.description')}</p>
      {!name && <p className="mt-3 text-sm"><Link to="/profile" className="font-semibold underline underline-offset-4">{t('dashboard.addName')}</Link></p>}
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-input pt-5 text-sm">
        <div><dt className="text-muted-foreground">{t('auth.email')}</dt><dd className="mt-1 break-all font-medium">{user?.email}</dd></div>
        <div><dt className="text-muted-foreground">{t('dashboard.role')}</dt><dd className="mt-1"><span className="inline-flex border border-foreground/40 bg-primary px-2.5 py-0.5 font-mono text-xs font-semibold text-brand-ink">{t(`roles.${role}`)}</span></dd></div>
      </dl>
    </header>
    <ContinueLearning className="mt-8" />
    <MonthlyChallenge className="mt-8" />
    <MyCourse className="mt-8" />
    <h2 className="sr-only">{t('dashboard.shortcuts')}</h2>
    <ul className="mt-8 grid gap-px border border-foreground bg-foreground sm:grid-cols-2">
      {links.map(({ to, title, description, icon: Icon, fill, hoverTint }) => <li key={to} className="bg-background sm:last:odd:col-span-2">
        <Link to={to} className={cn('group flex h-full items-start gap-5 p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', hoverTint)}>
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center border border-foreground text-brand-ink', fill)} aria-hidden="true"><Icon className="h-6 w-6" strokeWidth={1.75} /></span>
          <span className="min-w-0 flex-1"><span className="block text-xl font-semibold decoration-2 underline-offset-4 group-hover:underline">{title}</span><span className="mt-2 block text-muted-foreground">{description}</span></span>
          <ArrowUpRight className="mt-1 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </li>)}
    </ul>
    <IfesProgressOverview />
    <SequenceOverview />
    <StudyMilestones />
    <NotebookOverview />
  </>;
}
