import type { CatalogParams, ContentKind } from '@/entities/course/course.types';

export const courseKeys = {
  all: ['facodi'] as const,
  catalog: (params: CatalogParams) => ['facodi', 'courses', 'public', params] as const,
  units: (params: CatalogParams) => ['facodi', 'units', 'public', params] as const,
  resources: (params: CatalogParams) => ['facodi', 'resources', 'public', params] as const,
  unitFacets: () => ['facodi', 'units', 'facets', 'public'] as const,
  unit: (courseSlug: string, unitSlug: string) => ['facodi', 'unit', courseSlug, unitSlug] as const,
  counts: () => ['facodi', 'counts', 'public'] as const,
  topics: () => ['facodi', 'topics', 'public'] as const,
  detail: (slug: string) => ['facodi', 'course', slug] as const,
  resource: (slug: string) => ['facodi', 'resource', slug] as const,
  editor: (userId: string, kind: ContentKind, params: CatalogParams) => ['facodi', 'private', userId, kind, params] as const,
  options: (userId: string, kind: ContentKind, search: string) => ['facodi', 'private', userId, 'options', kind, search] as const,
  overview: (userId: string) => ['facodi', 'private', userId, 'overview'] as const,
};
