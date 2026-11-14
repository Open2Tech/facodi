import type { Database } from '@/integrations/supabase/types';

type Tables = Database['facodi']['Tables'];
export type Course = Tables['courses']['Row'];
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
  search: string; language: string; page: number; tag?: string;
  course?: string; year?: number; semester?: number; sort?: UnitSort;
}
export const PAGE_SIZE = 12;
