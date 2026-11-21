export const unitPath = (courseSlug: string, unitSlug: string) =>
  `/courses/${encodeURIComponent(courseSlug)}/units/${encodeURIComponent(unitSlug)}`;

/** Stable entrypoint for course resources, with optional UC and shareable search. */
export const courseMaterialsPath = (courseSlug: string, unitSlug?: string | null, search?: string | null) => {
  const path = `/courses/${encodeURIComponent(courseSlug)}`;
  const params = [
    unitSlug ? `materialsUnit=${encodeURIComponent(unitSlug)}` : null,
    search?.trim() ? `materialsSearch=${encodeURIComponent(search.trim())}` : null,
  ].filter(Boolean);
  return `${path}${params.length ? `?${params.join('&')}` : ''}#course-materials`;
};
