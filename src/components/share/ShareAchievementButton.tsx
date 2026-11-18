import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createAchievementImage } from '@/features/share/achievementCard';
import { canonicalUrl } from '@/shared/seo/seo';

/** After a finished sequence: a story-format image to share (phones) or save (desktop). */
export function ShareAchievementButton({ title, path, lessons }: { title: string; path: string; lessons: number }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  async function share() {
    setBusy(true);
    try {
      const url = canonicalUrl(path);
      const blob = await createAchievementImage({
        eyebrow: t('shareCard.eyebrow'),
        title,
        detail: t('sequences.lessons', { count: lessons }),
        site: new URL(url).host,
      });
      const file = new File([blob], 'facodi-sequencia-concluida.png', { type: 'image/png' });
      const text = t('shareCard.text', { title });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text, url });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        }
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(t('shareCard.saved'));
    } catch {
      toast.error(t('shareCard.failed'));
    } finally {
      setBusy(false);
    }
  }
  return <Button type="button" size="sm" className="mt-4" disabled={busy} onClick={() => void share()}>
    <Share2 aria-hidden="true" />{t('shareCard.button')}
  </Button>;
}
