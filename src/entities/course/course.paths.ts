export const unitPath = (courseSlug: string, unitSlug: string) =>
  `/courses/${encodeURIComponent(courseSlug)}/units/${encodeURIComponent(unitSlug)}`;
