import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Check, Scale } from 'lucide-react';
import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { cn } from '@/lib/utils';
import { RememberPreferences } from '@/components/profile/RememberPreferences';
import { LegalRichText } from './LegalRichText';
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATED, legalPath, type LegalDocumentContent, type LegalDocumentId, type LegalSection } from './legalDocuments';

function useHashScroll(hash: string) {
  useEffect(() => {
    if (!hash) return;
    // Defer past the layout's scroll-to-top on route change.
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);
}

export function LegalDocument({ id }: { id: LegalDocumentId }) {
  const { t, i18n } = useTranslation();
  const { hash } = useLocation();
  const doc = t(`legal.${id}`, { returnObjects: true }) as LegalDocumentContent;
  const updated = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(LEGAL_LAST_UPDATED));
  useHashScroll(hash);

  const index = <ol className="space-y-1 text-sm">
    {doc.sections.map((section, position) => <li key={section.id}>
      <a href={`#${section.id}`} className="flex gap-3 px-2 py-1.5 transition-colors hover:bg-muted">
        <span className="shrink-0 font-mono text-xs leading-5 text-muted-foreground">{String(position + 1).padStart(2, '0')}</span>
        <span>{section.title}</span>
      </a>
    </li>)}
  </ol>;

  return <article className="pb-10">
    <PageSeo {...staticPageMeta(legalPath(id), { title: doc.title, description: doc.description })} />
    <header className="grid gap-6 border-b border-foreground pb-10 lg:grid-cols-[1fr_0.8fr]">
      <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{doc.title}</h1>
      <div className="max-w-xl space-y-4 self-end">
        <p className="text-lg leading-relaxed text-muted-foreground">{doc.lead}</p>
        <p className="font-mono text-xs text-muted-foreground">{t('legal.common.updated')} <time dateTime={LEGAL_LAST_UPDATED}>{updated}</time></p>
      </div>
    </header>

    <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-16">
      <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
        <details className="border border-input lg:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{t('legal.common.toc')}</summary>
          <div className="border-t border-input p-2">{index}</div>
        </details>
        <nav aria-label={t('legal.common.toc')} className="hidden lg:block">
          <h2 className="mb-3 px-2 text-sm font-semibold">{t('legal.common.toc')}</h2>
          {index}
        </nav>
      </aside>

      <div className="min-w-0 max-w-3xl space-y-12">
        <div role="note" className="flex gap-4 border border-input bg-muted/40 p-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-foreground bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">{t('legal.common.reviewTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('legal.common.reviewText')}</p>
          </div>
        </div>

        {doc.summary?.length ? <section aria-labelledby="legal-summary" className="border border-foreground p-6 sm:p-8">
          <h2 id="legal-summary" className="text-xl font-semibold">{t('legal.common.summary')}</h2>
          <ul className="mt-5 space-y-3">
            {doc.summary.map(item => <li key={item} className="flex gap-3 leading-relaxed">
              <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span><LegalRichText text={item} /></span>
            </li>)}
          </ul>
        </section> : null}

        {doc.sections.map((section, position) => <Section key={section.id} section={section} number={position + 1} pendingLabel={t('legal.common.pending')}>
          {id === 'cookies' && section.id === 'manage' ? <RememberPreferences className="mt-6" /> : null}
        </Section>)}
      </div>
    </div>

    <nav aria-labelledby="legal-related" className="mt-16 border-t-4 border-primary bg-ink p-6 text-ink-foreground sm:p-8">
      <h2 id="legal-related" className="text-xl font-semibold">{t('legal.common.related')}</h2>
      <ul className="mt-5 grid gap-px bg-ink-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
        {LEGAL_DOCUMENTS.map(other => <li key={other} className="bg-ink">
          {other === id
            ? <span aria-current="page" className="flex h-full items-center justify-between gap-3 bg-primary p-4 font-semibold text-primary-foreground">{t(`legal.nav.${other}`)}</span>
            : <Link to={legalPath(other)} className="flex h-full items-center justify-between gap-3 p-4 font-semibold transition-colors hover:bg-ink-foreground/10 hover:text-primary">
              {t(`legal.nav.${other}`)}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>}
        </li>)}
      </ul>
    </nav>
  </article>;
}

function Section({ section, number, pendingLabel, children }: { section: LegalSection; number: number; pendingLabel: string; children?: ReactNode }) {
  const headingId = `${section.id}-title`;
  return <section id={section.id} aria-labelledby={headingId} className="scroll-mt-28 border-t border-input pt-8">
    <h2 id={headingId} className="flex gap-4 text-2xl font-semibold leading-snug">
      <span className="shrink-0 pt-1.5 font-mono text-sm font-medium text-muted-foreground" aria-hidden="true">{String(number).padStart(2, '0')}</span>
      <span>{section.title}</span>
    </h2>
    <div className="mt-5 max-w-[68ch] space-y-4 leading-relaxed text-foreground/90">
      {section.body?.map(paragraph => <p key={paragraph}><LegalRichText text={paragraph} /></p>)}
      {section.items?.length ? <ul className="space-y-2.5">
        {section.items.map(item => <li key={item} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-foreground" aria-hidden="true" /><span><LegalRichText text={item} /></span>
        </li>)}
      </ul> : null}
    </div>
    {section.facts?.length ? <dl className="mt-6 divide-y divide-input border-y border-input">
      {section.facts.map(fact => <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr] sm:gap-6">
        <dt className="text-sm font-semibold">{fact.label}</dt>
        <dd className={cn('text-sm leading-relaxed', fact.pending ? 'text-muted-foreground' : 'text-foreground')}>
          {fact.pending && <span className="mr-2 inline-block bg-primary px-1.5 py-0.5 font-mono text-[0.7rem] font-medium uppercase tracking-wide text-primary-foreground">{pendingLabel}</span>}
          <LegalRichText text={fact.value} />
        </dd>
      </div>)}
    </dl> : null}
    {section.table ? <div className="mt-6 overflow-x-auto border border-input">
      <table className={cn('w-full border-collapse text-left text-sm', section.table.code ? 'min-w-[48rem]' : 'min-w-[40rem]')}>
        <caption className="sr-only">{section.table.caption}</caption>
        <thead className="bg-muted/60">
          <tr>{section.table.columns.map(column => <th key={column} scope="col" className="border-b border-input px-4 py-3 font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>
          {section.table.rows.map(row => <tr key={row.join('|')} className="border-b border-input last:border-b-0 align-top">
            {row.map((cell, cellIndex) => cellIndex === 0
              ? <th key={cellIndex} scope="row" className={cn('px-4 py-3 font-semibold [overflow-wrap:anywhere]', section.table?.code && 'min-w-[13rem] font-mono text-xs font-medium')}>{cell}</th>
              : <td key={cellIndex} className="px-4 py-3 leading-relaxed text-foreground/90"><LegalRichText text={cell} /></td>)}
          </tr>)}
        </tbody>
      </table>
    </div> : null}
    {children}
  </section>;
}
