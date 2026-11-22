import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { discoveryMilestones } from '@/features/discoveries/milestones';
import { rememberDiscovery } from '@/features/discoveries/useDiscoveries';
import type { Discovery } from '@/features/discoveries/catalog';

export function useDiscoveryReward() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (id: Discovery) => {
    const count = rememberDiscovery(id);
    if (!count) return;
    const milestone = discoveryMilestones.find(item => item.target === count);
    toast.success(t(milestone ? 'discoveries.stampEarned' : 'discoveries.found'), {
      description: t(milestone ? `discoveries.stamps.${milestone.id}` : `discoveries.hints.${id}`),
      action: {
        label: t('discoveries.openAlbum'),
        onClick: event => {
          // Let the toast restore focus before the album requests it.
          event.currentTarget.blur();
          navigate('/#discoveries');
        },
      },
    });
  };
}
