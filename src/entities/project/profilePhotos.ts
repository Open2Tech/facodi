/**
 * Photos provided for the FACODI project credits, served as local JPEG assets.
 * Match project_profiles.slug; other profiles keep their existing icon fallback.
 */
export const PROFILE_PHOTOS: Readonly<Record<string, string>> = {
  'gustavo-scheidt': '/team/gustavo.jpeg',
  'marcelo-santos': '/team/marcelo-santos.jpeg',
};

export const profilePhoto = (slug: string) => PROFILE_PHOTOS[slug] ?? null;
