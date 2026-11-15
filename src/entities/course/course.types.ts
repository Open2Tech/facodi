import type { Database } from '@/integrations/supabase/types';

type Tables = Database['facodi']['Tables'];
export type Course = Tables['courses']['Row'];
/** Public catalogue row with its number of publicly visible curricular units. */
export type PublicCourse = Course & { unit_count: number };
export type CourseInsert = Tables['courses']['Insert'];
export type CourseUpdate = Tables['courses']['Update'];
export type CurricularUnit = Tables['curricular_units']['Row'];
export type UnitInsert = Tables['curricular_units']['Insert'];
export type UnitUpdate = Tables['curricular_units']['Update'];
export type LearningObject = Tables['learning_objects']['Row'];
export type ResourceInsert = Tables['learning_objects']['Insert'];
export type ResourceUpdate = Tables['learning_objects']['Update'];
export type ContentKind = 'courses' | 'curricular_units' | 'learning_objects';
export type Content = Course | CurricularUnit | LearningObject;
export type UnitSort = 'curriculum' | 'title' | 'ects';
export interface CatalogParams {
  search: string; language: string; page: number; tag?: string; area?: string;
  course?: string; year?: number; semester?: number; sort?: UnitSort;
  status?: EditorialStatus; objectType?: string;
}
export const EDITORIAL_STATUSES = ['draft', 'active', 'published', 'archived'] as const;
export type EditorialStatus = typeof EDITORIAL_STATUSES[number];
export const PAGE_SIZE = 12;
