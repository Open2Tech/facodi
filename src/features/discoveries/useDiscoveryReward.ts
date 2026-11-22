import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { rememberDiscovery } from '@/features/discoveries/useDiscoveries';
import type { Discovery } from '@/features/discoveries/catalog';

export function useDiscoveryReward() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (id: Discovery) => {
    if (!rememberDiscovery(id)) return;
    toast.success(t('discoveries.found'), {
      description: t(`discoveries.hints.${id}`),
      action: {
        label: t('discoveries.openAlbum'),
        onClick: () => navigate('/#discoveries'),
      },
    });
  };
}
