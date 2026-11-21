export const unitPath = (courseSlug: string, unitSlug: string) =>
  `/courses/${encodeURIComponent(courseSlug)}/units/${encodeURIComponent(unitSlug)}`;

/** Stable entrypoint for a course's resources, optionally scoped to one exact UC. */
export const courseMaterialsPath = (courseSlug: string, unitSlug?: string | null) => {
  const path = `/courses/${encodeURIComponent(courseSlug)}`;
  const query = unitSlug ? `?materialsUnit=${encodeURIComponent(unitSlug)}` : '';
  return `${path}${query}#course-materials`;
};
