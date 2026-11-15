import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { canonicalUrl } from '@/shared/seo/seo';

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const { t } = useTranslation();
  const location = useLocation();

  async function share() {
    const currentParams = new URLSearchParams(location.search);
    const params = new URLSearchParams();
    for (const key of ['v', 't']) {
      const value = currentParams.get(key);
      if (value) params.set(key, value);
    }
    const shareUrl = new URL(canonicalUrl(location.pathname));
    shareUrl.search = params.toString();
    shareUrl.hash = location.hash;
    const url = shareUrl.toString();

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') return;
        toast.error(t('common.shareFailed'));
      }
      return;
    }

    if (typeof navigator.clipboard?.writeText !== 'function') {
      toast.error(t('common.copyFailed'));
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.linkCopied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  }

  return <Button type="button" variant="outline" onClick={() => void share()}>
    <Share2 aria-hidden="true" />{t('common.share')}
  </Button>;
}
