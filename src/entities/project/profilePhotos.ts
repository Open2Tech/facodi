/**
 * Portraits for people credited on /about, served from public/team (square WebP, 256 px).
 * Keyed by project_profiles.slug. Only add a photo the person supplied for this purpose;
 * the card falls back to its icon for everyone else.
 */
export const PROFILE_PHOTOS: Readonly<Record<string, string>> = {
  'gustavo-scheidt': '/team/gustavo-scheidt.webp',
};

export const profilePhoto = (slug: string) => PROFILE_PHOTOS[slug] ?? null;
