import { useId, useState } from 'react';
import { Compass, Link2, NotebookPen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CampusDiscovery as Discovery } from '@/features/discoveries/catalog';
import { useDiscoveryAnchor } from '@/features/discoveries/useDiscoveryAnchor';
import { rememberDiscovery } from '@/features/discoveries/useDiscoveries';

const icons = { compass: Compass, chain: Link2, margin: NotebookPen };

export function CampusDiscovery({ discovery }: { discovery: Discovery }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const messageId = useId();
  const Icon = icons[discovery];
  const anchor = `discovery-${discovery}`;
  useDiscoveryAnchor(anchor);

  return <div id={anchor} className="flex min-w-0 scroll-mt-24 flex-wrap items-center gap-3">
    <button type="button" aria-label={t(`discoveries.hints.${discovery}`)} aria-expanded={open} aria-controls={messageId}
      className="grid size-11 shrink-0 place-items-center border border-foreground bg-brand-mint text-brand-ink hover:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => { if (!open) rememberDiscovery(discovery); setOpen(!open); }}>
      <Icon className="size-6 motion-safe:transition-transform motion-safe:duration-300" style={{ transform: open ? 'rotate(-16deg)' : undefined }} aria-hidden="true" />
    </button>
    <p id={messageId} hidden={!open} className="max-w-prose flex-1 basis-52 text-sm">{t(`discoveries.messages.${discovery}`)}</p>
  </div>;
}
