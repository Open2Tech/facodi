import type { Json } from '@/integrations/supabase/types';
import type { Blueprint } from '@/entities/contribution/contribution.types';

export interface BlueprintElement {
  order: number;
  label: string;
  code: string;
  year: number | null;
  semester: number | null;
  ects: number | null;
  activity: string;
}

export interface BlueprintView {
  isCourse: boolean;
  code: string;
  title: string;
  courseCode: string;
  ects: number | null;
  year: number | null;
  semester: number | null;
  videoLinks: number | null;
  readingLinks: number | null;
  officialUrl: string | null;
  elements: BlueprintElement[];
}

type Fields = Record<string, Json | undefined>;

function fields(json: Json | undefined): Fields {
  return json && typeof json === 'object' && !Array.isArray(json) ? json as Fields : {};
}
function text(...values: (Json | undefined)[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}
function num(...values: (Json | undefined)[]): number | null {
  for (const value of values) if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}
function list(...values: (Json | undefined)[]): Fields[] {
  for (const value of values) if (Array.isArray(value)) return value.map(fields);
  return [];
}

/** Normalises both deterministic blueprint generations (v1 `steps`/`available_*`, v2 `topics`/`approved_*`/`official_*`). */
export function readBlueprint(blueprint: Pick<Blueprint, 'structure_type' | 'prompt' | 'result'>): BlueprintView {
  const input = fields(blueprint.prompt);
  const output = fields(blueprint.result);
  const isCourse = blueprint.structure_type === 'curriculum_mapping';
  const code = text(output.code, output.unit_code, isCourse ? input.official_course_id : input.unit_code);
  const officialUrl = text(output.official_plan, output.official_url);
  return {
    isCourse,
    code,
    title: text(output.title, output.unit_title, output.official_title) || code,
    courseCode: isCourse ? '' : text(output.course_code, input.official_course_code),
    ects: num(output.ects_total, output.ects),
    year: isCourse ? null : num(output.year),
    semester: isCourse ? null : num(output.semester),
    videoLinks: num(output.available_video_links, output.approved_video_links),
    readingLinks: num(output.available_reading_links, output.approved_reading_links),
    officialUrl: officialUrl.startsWith('https://') ? officialUrl : null,
    elements: (isCourse ? list(output.units) : list(output.steps, output.topics)).map((item, index) => ({
      order: num(item.order) ?? index + 1,
      label: text(item.topic, item.title, item.code),
      code: isCourse ? text(item.code) : '',
      year: num(item.year),
      semester: num(item.semester),
      ects: num(item.ects),
      activity: text(item.activity),
    })),
  };
}
