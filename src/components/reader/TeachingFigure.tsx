import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LessonFigure } from '@/entities/course/lessonReader';

const fills = ['bg-brand-cyan', 'bg-brand-orange', 'bg-brand-mint', 'bg-brand-pink'];

export function TeachingFigure({ figure, language }: { figure: LessonFigure; language: string }) {
  const { t } = useTranslation(undefined, { lng: language });
  const money = new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const { chart } = figure;
  const [received, setReceived] = useState(chart.kind === 'payment' ? Math.min(chart.initial, chart.invoice) : 0);
  const scale = chart.kind === 'bars' ? Math.max(1, ...chart.rows.map(row => row.value)) : 1;
  const total = chart.kind === 'parts' ? chart.rows.reduce((sum, row) => sum + row.value, 0) : 0;
  return <figure className="overflow-hidden rounded-lg border-2 border-foreground bg-card">
    <figcaption className="border-b border-foreground bg-brand-mint px-5 py-4 text-xl font-bold tracking-tight text-brand-ink">{figure.title}</figcaption>
    <div className="p-5 sm:p-7">
      {chart.kind === 'payment' && <div>
        <label className="flex items-baseline justify-between gap-4 font-semibold" htmlFor="lesson-payment">{chart.received}<span className="font-mono">{money.format(received)}</span></label>
        <input id="lesson-payment" type="range" min={0} max={chart.invoice} step={1} value={received} onChange={event => setReceived(Number(event.target.value))} aria-valuetext={money.format(received)} className="my-3 h-8 w-full cursor-pointer accent-foreground" />
        <div aria-hidden="true" className="flex h-10 overflow-hidden rounded border border-foreground bg-brand-orange">
          <div className="h-full bg-brand-cyan" style={{width:`${100 * received / chart.invoice}%`}} /></div>
        <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm"><span className="inline-flex items-center gap-2"><i aria-hidden="true" className="h-3 w-3 border border-foreground bg-brand-cyan" />{chart.received} · {money.format(received)}</span><output htmlFor="lesson-payment" className="inline-flex items-center gap-2 font-semibold"><i aria-hidden="true" className="h-3 w-3 border border-foreground bg-brand-orange" />{chart.remaining} · {money.format(chart.invoice-received)}</output></div>
      </div>}
      {chart.kind === 'ledger' && <><div className="mb-6 grid gap-3 sm:grid-cols-2">
        {(['debit', 'credit'] as const).map(side => {
          const sum = chart.rows.reduce((n, row) => n + row[side], 0);
          return <div key={side}>
            <div className="mb-2 flex justify-between text-sm font-bold">{t(`reader.${side}`)}<span className="font-mono">{money.format(sum)}</span></div>
            <div className="flex h-8 overflow-hidden rounded border border-foreground" aria-hidden="true">
              {chart.rows.map((row, i) => row[side] > 0 && <div key={row.label} className={`border-r border-foreground last:border-0 ${fills[i % fills.length]}`} style={{ width: `${100 * row[side] / sum}%` }} />)}
            </div>
          </div>;
        })}
      </div><table className="w-full border-collapse text-sm sm:text-base">
        <thead><tr className="border-b-2 border-foreground">{['account', 'debit', 'credit'].map((key, i) =>
          <th key={key} scope="col" className={i ? 'pb-2 text-right' : 'pb-2 text-left'}>{t(`reader.${key}`)}</th>)}</tr></thead>
        <tbody>{chart.rows.map((row, i) => <tr key={row.label} className="border-b border-input">
          <th scope="row" className="py-2 text-left font-medium"><span aria-hidden="true" className={`mr-2 inline-block h-3 w-3 border border-foreground ${fills[i % fills.length]}`} />{row.label}</th>
          {[row.debit, row.credit].map((n, i) => <td key={i} className="py-2 text-right font-mono tabular-nums">{n ? money.format(n) : '—'}</td>)}
        </tr>)}</tbody><tfoot><tr className="font-bold"><th scope="row" className="pt-3 text-left">{t('reader.total')}</th>
          {(['debit','credit'] as const).map(key => <td key={key} className="pt-3 text-right font-mono">{money.format(chart.rows.reduce((sum,row) => sum + row[key], 0))}</td>)}</tr></tfoot>
      </table></>}
      {chart.kind === 'bars' && <ul className="space-y-4">{chart.rows.map((row, i) => <li key={row.label}>
        <div className="flex justify-between gap-3 text-sm"><span>{row.label}</span><strong className="shrink-0 font-mono">{money.format(row.value)}</strong></div>
        <div aria-hidden="true" className="mt-1.5 h-4 overflow-hidden rounded-sm border border-input bg-muted"><div className={`h-full ${fills[i % fills.length]}`} style={{ width: `${row.value / scale * 100}%` }} /></div>
      </li>)}</ul>}
      {chart.kind === 'parts' && <>
        <div className="flex h-12 overflow-hidden rounded border border-foreground" aria-hidden="true">{chart.rows.map((row, i) =>
          <div key={row.label} className={`h-full border-r border-foreground last:border-0 ${fills[i % fills.length]}`} style={{width: `${total ? row.value / total * 100 : 0}%`}} />)}</div>
        <ul className="mt-4 space-y-2">{chart.rows.map((row, i) => <li className="flex items-center gap-2" key={row.label}>
          <span aria-hidden="true" className={`h-3 w-3 shrink-0 border border-foreground ${fills[i % fills.length]}`} />{row.label}
          <strong className="ml-auto whitespace-nowrap font-mono">{money.format(row.value)}</strong></li>)}</ul>
      </>}
      {chart.kind === 'flow' && <ol className="flex flex-col gap-3 md:flex-row">{chart.rows.map((row, i) =>
        <li key={row.label} className="flex min-w-0 flex-1 flex-col items-start gap-2 md:flex-row">
          {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 rotate-90 md:mt-4 md:rotate-0" aria-hidden="true" />}
          <div className="w-full rounded border border-foreground p-3"><strong className="block">{row.label}</strong><span className="mt-1 block text-sm">{row.detail}</span></div>
        </li>)}</ol>}
    </div>
    <p className="border-t border-input px-5 py-3 text-sm leading-relaxed">{figure.caption}</p>
  </figure>;
}
