import { useTranslation } from 'react-i18next';
import { Expand } from 'lucide-react';
import type { OdooScreen } from '@/entities/course/lessonReader';

export function OdooScreenFigure({ screen, language }: { screen: OdooScreen; language: string }) {
  const { t } = useTranslation(undefined, { lng: language });
  const file = `/media/odoo-accounting/${screen.asset}.webp`;
  return <figure className="mt-4 overflow-hidden rounded-lg border border-input bg-card">
    <a href={file} target="_blank" rel="noreferrer" className="group block bg-white p-2 sm:p-4">
      <img src={file} width={screen.width} height={screen.height} alt={screen.alt} loading="lazy" decoding="async" className="mx-auto h-auto max-h-[26rem] max-w-full object-contain" />
      <span className="mt-2 ml-auto flex w-fit items-center gap-1 rounded border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm group-hover:underline">
        <Expand size={14} aria-hidden="true" />{t('reader.enlarge')}
      </span>
    </a>
    <figcaption className="border-t border-input px-4 py-3">
      <p className="max-w-prose leading-relaxed">{screen.caption}</p>
      <small className="mt-2 block text-muted-foreground">
        <a className="underline" href={`https://www.odoo.com/documentation/19.0/_images/${screen.original}`} target="_blank" rel="noreferrer">Odoo 19.0</a>
        {' · '}<a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
      </small>
    </figcaption>
  </figure>;
}
