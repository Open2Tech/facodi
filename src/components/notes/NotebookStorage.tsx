import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotebook } from '@/features/notes/useNotebook';

/** Where the notebook lives: the account (synced, private) or this browser (visitors). */
export function NotebookStorage({ isGuest }: { isGuest: boolean }) {
  const { t } = useTranslation();
  const Icon = isGuest ? HardDrive : Cloud;
  return <p className="flex items-start gap-2 text-xs text-muted-foreground">
    <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />{t(isGuest ? 'notes.storedLocally' : 'notes.storedAccount')}
  </p>;
}

/**
 * Offers to move visitor notes from this browser into the signed-in account. It stays an explicit
 * choice because a shared computer's guest notebook may belong to someone else.
 */
export function GuestImport() {
  const { t } = useTranslation();
  const { pendingGuest, importGuest, ready } = useNotebook();
  const [busy, setBusy] = useState(false);
  if (!ready || !pendingGuest) return null;

  async function run() {
    setBusy(true);
    try {
      const { moved, failed } = await importGuest();
      if (moved) toast.success(t('notes.guestImported', { count: moved }), { position: 'bottom-left' });
      if (failed) toast.error(t('notes.guestImportPartial', { count: failed }), { position: 'bottom-left' });
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-input bg-background px-3 py-2 text-xs">
    <p className="flex-1">{t('notes.guestPending', { count: pendingGuest })}</p>
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void run()}>{t('notes.guestImport')}</Button>
  </div>;
}
