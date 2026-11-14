import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ListPlus, ListVideo, Route } from 'lucide-react';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { useAuth } from '@/features/auth/useAuth';
import { useBlueprintCounts, usePendingPlaylists } from '@/features/contributions/queries/useContributions';
import { PlaylistHistory } from '@/components/contribution/PlaylistHistory';
import { Button } from '@/components/ui/button';

function ReviewQueues() {
  const { t } = useTranslation();
  const playlists = usePendingPlaylists();
  const blueprints = useBlueprintCounts();
  const queues = [
    { to: '/editor/playlists', icon: ListVideo, title: t('playlistReview.title'), count: playlists.data?.length },
    { to: '/editor/study-paths?status=draft', icon: Route, title: t('studyReview.title'), count: blueprints.data?.draft },
  ];
  return <div className="mt-10">
    <h3 className="text-base font-semibold">{t('profile.reviewQueues')}</h3>
    <ul className="mt-3 divide-y divide-input border-y border-input">
      {queues.map(({ to, icon: Icon, title, count }) => <li key={to}>
        <Link to={to} className="group flex items-center gap-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 font-medium underline-offset-4 group-hover:underline">{title}</span>
          <span className="tabular-nums text-muted-foreground">{count === undefined ? '…' : t('profile.pendingCount', { count })}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </li>)}
    </ul>
  </div>;
}

export function ContributionSummary() {
  const { t } = useTranslation();
  const { role } = useAuth();
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-semibold">{t('playlistSubmit.history')}</h3>
      <Button asChild variant="outline" size="sm"><Link to="/playlists/submit"><ListPlus aria-hidden="true" />{t('profile.proposePlaylist')}</Link></Button>
    </div>
    <PlaylistHistory />
    {canAccessFacodiRoute(role, 'editor') && <ReviewQueues />}
  </div>;
}
