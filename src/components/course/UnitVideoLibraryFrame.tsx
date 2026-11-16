import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** Keeps all directly linked videos accessible without mounting a potentially
 * large video player/list while the secondary library is closed.
 * Explicit video links and #unit-resources anchors open the library automatically.
 */
export function UnitVideoLibraryFrame({ collapsed, count, forceOpen = false, children }: {
  collapsed: boolean;
  count: number;
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(forceOpen);
  useEffect(() => {
    if (forceOpen) setExpanded(true);
  }, [forceOpen]);

  if (!collapsed) return <>{children}</>;
  return <details className="border-t border-input pt-6" open={expanded}
    onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary className="cursor-pointer text-lg font-semibold hover:underline hover:underline-offset-4">
      {t('composedPath.library', { count })}
    </summary>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('composedPath.libraryNote')}</p>
    {expanded && <div className="mt-6">{children}</div>}
  </details>;
}
