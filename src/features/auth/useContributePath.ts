import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';

/** Editors go straight to the editorial workspace; everyone else learns how contributions are reviewed. */
export function useContributePath() {
  const { role } = useAuth();
  return canAccessFacodiRoute(role, 'editor') ? '/editor' : '/about#contribute';
}
