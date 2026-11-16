import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** Keeps every directly linked video accessible, but avoids a second competing
 * learning path in units that have an editorially composed study journey. */
export function UnitVideoLibraryFrame({ collapsed, count, children }: {
  collapsed: boolean;
  count: number;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return collapsed
    ? <details className="border-t border-input pt-6">
      <summary className="cursor-pointer text-lg font-semibold hover:underline hover:underline-offset-4">
        {t('composedPath.library', { count })}
      </summary>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('composedPath.libraryNote')}</p>
      <div className="mt-6">{children}</div>
    </details>
    : <>{children}</>;
}
