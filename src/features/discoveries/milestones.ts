import { discoveryLinks } from '@/features/discoveries/catalog';

export const discoveryMilestones = [
  { id: 'first', target: 1 },
  { id: 'curious', target: 5 },
  { id: 'explorer', target: 15 },
  { id: 'complete', target: discoveryLinks.length },
] as const;
