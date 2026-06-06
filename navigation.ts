import type { View } from './view';

export type NavigationItem = {
  id: string;
  labelKey: string;
  icon: string;
  kind: 'view' | 'page' | 'external';
  view?: View;
  slug?: string;
  href: string;
  activeViews?: View[];
  featured?: boolean;
};

export const mainNavigationItems: NavigationItem[] = [
  { id: 'home', labelKey: 'nav.home', icon: 'home', kind: 'view', view: 'home', href: '/', activeViews: ['home'] },
  { id: 'courses', labelKey: 'nav.courses', icon: 'school', kind: 'view', view: 'courses', href: '/courses', activeViews: ['courses'] },
  { id: 'trails', labelKey: 'nav.trails', icon: 'route', kind: 'page', slug: 'roadmap', href: '/roadmap' },
  { id: 'videos', labelKey: 'nav.videos', icon: 'subscriptions', kind: 'view', view: 'videos', href: '/videos', activeViews: ['videos', 'video-detail', 'video-submit', 'video-submit-status'], featured: true },
  { id: 'community', labelKey: 'nav.community', icon: 'groups', kind: 'page', slug: 'comunidade', href: '/comunidade' },
  { id: 'about', labelKey: 'nav.about', icon: 'info', kind: 'page', slug: 'sobre', href: '/sobre' },
];

export const secondaryNavigationItems: NavigationItem[] = [
  { id: 'units', labelKey: 'nav.units', icon: 'grid_view', kind: 'view', view: 'repository', href: '/courses/units', activeViews: ['repository', 'course-detail', 'lesson-detail'] },
  { id: 'progress', labelKey: 'nav.progress', icon: 'dashboard', kind: 'view', view: 'dashboard', href: '/dashboard', activeViews: ['dashboard'] },
  { id: 'blog', labelKey: 'nav.blog', icon: 'article', kind: 'view', view: 'blog', href: '/blog', activeViews: ['blog', 'blog-post'] },
];

export const projectNavigationItems: NavigationItem[] = [
  { id: 'manifesto', labelKey: 'nav.manifesto', icon: 'flag', kind: 'page', slug: 'manifesto', href: '/manifesto' },
  { id: 'roadmap', labelKey: 'nav.roadmap', icon: 'route', kind: 'page', slug: 'roadmap', href: '/roadmap' },
  { id: 'community-project', labelKey: 'nav.community', icon: 'groups', kind: 'page', slug: 'comunidade', href: '/comunidade' },
  { id: 'contribute', labelKey: 'nav.contribute', icon: 'volunteer_activism', kind: 'page', slug: 'como-contribuir', href: '/como-contribuir' },
  { id: 'contact', labelKey: 'nav.contact', icon: 'contact_support', kind: 'page', slug: 'contacto', href: '/contacto' },
];

export const footerExploreItems: NavigationItem[] = [
  mainNavigationItems[1],
  secondaryNavigationItems[0],
  mainNavigationItems[3],
  mainNavigationItems[2],
  secondaryNavigationItems[2],
];

export const footerCommunityItems: NavigationItem[] = [
  { id: 'suggest-content', labelKey: 'footer.suggestContent', icon: 'add_link', kind: 'view', view: 'video-submit', href: '/videos/submit', activeViews: ['video-submit', 'video-submit-status'] },
  { id: 'become-curator', labelKey: 'footer.becomeCurator', icon: 'edit_note', kind: 'view', view: 'curator-apply', href: '/curator/apply', activeViews: ['curator-apply'] },
  projectNavigationItems[2],
  projectNavigationItems[4],
];

export const footerLegalItems: NavigationItem[] = [
  mainNavigationItems[5],
  { id: 'privacy', labelKey: 'footer.privacy', icon: 'lock', kind: 'page', slug: 'privacidade', href: '/privacidade' },
  { id: 'terms', labelKey: 'footer.terms', icon: 'gavel', kind: 'page', slug: 'termos', href: '/termos' },
  { id: 'cookies', labelKey: 'footer.cookies', icon: 'cookie', kind: 'page', slug: 'cookies', href: '/cookies' },
  { id: 'credits', labelKey: 'footer.credits', icon: 'workspace_premium', kind: 'page', slug: 'sobre-open2', href: '/sobre-open2' },
];