import { Category, Course, CurricularUnit, Difficulty, Playlist } from '../types';
import { supabase } from './supabase';
import type { Database } from './supabase.types';

export type CatalogSource = 'facodi';

export type CatalogPayload = {
  source: CatalogSource;
  courses: Course[];
  units: CurricularUnit[];
  playlists: Playlist[];
};

type CatalogCourseRow = Database['facodi']['Views']['v_catalog_courses']['Row'];
type CatalogUnitRow = Database['facodi']['Views']['v_catalog_units']['Row'];
type CatalogPlaylistRow = Database['facodi']['Views']['v_catalog_playlists']['Row'];

const CATEGORY_MAP: Record<string, Category> = {
  communication: Category.COMMUNICATION,
  computer_science: Category.COMPUTER_SCIENCE,
  design: Category.DESIGN,
  engineering: Category.ENGINEERING,
  humanities: Category.HUMANITIES,
  management: Category.MANAGEMENT,
  mathematics: Category.MATHEMATICS,
  arts_ui: Category.ARTS_UI,
  ethics: Category.ETHICS,
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  foundational: Difficulty.FOUNDATIONAL,
  intermediate: Difficulty.INTERMEDIATE,
  advanced: Difficulty.ADVANCED,
  expert: Difficulty.EXPERT,
};

function normalizeKey(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function mapCategory(value: string | null | undefined): Category {
  return CATEGORY_MAP[normalizeKey(value)] ?? Category.COMPUTER_SCIENCE;
}

function mapDifficulty(value: string | null | undefined): Difficulty {
  return DIFFICULTY_MAP[normalizeKey(value)] ?? Difficulty.FOUNDATIONAL;
}

function mapDegreeType(value: string | null | undefined): Course['degreeType'] {
  if (value === 'bachelor' || value === 'master') return value;
  return 'other';
}

function mapCourse(row: CatalogCourseRow): Course {
  if (!row.id || !row.title) {
    throw new Error('[catalogSource:facodi] Invalid course row.');
  }

  return {
    id: row.id,
    code: row.code ?? undefined,
    slug: row.slug ?? undefined,
    title: row.title,
    description: row.description || row.title,
    ects: Number(row.ects) || 0,
    semesters: Number(row.semesters) || 6,
    institution: row.institution ?? 'FACODI',
    school: row.school ?? 'FACODI',
    degreeType: mapDegreeType(row.degree_type),
    language: row.language ?? 'pt',
    longDescription: row.long_description || row.description || row.title,
    websiteUrl: row.website_url ?? undefined,
    curriculumVersion: row.curriculum_version ?? undefined,
    contentLicense: row.content_license ?? undefined,
  };
}

function mapUnit(row: CatalogUnitRow, validCourseIds: Set<string>): CurricularUnit {
  if (!row.id || !row.name || !row.course_id) {
    throw new Error('[catalogSource:facodi] Invalid curricular unit row.');
  }
  if (!validCourseIds.has(row.course_id)) {
    throw new Error(`[catalogSource:facodi] Unit ${row.id} references unknown course ${row.course_id}.`);
  }

  return {
    id: row.id,
    code: row.code ?? undefined,
    slug: row.slug ?? undefined,
    name: row.name,
    description: row.summary || row.content || '',
    content: row.content ?? undefined,
    contentUrl: row.content_url ?? undefined,
    syllabusUrl: row.syllabus_url ?? undefined,
    ects: Number(row.ects) || 0,
    semester: Number(row.semester) || 1,
    year: Number(row.year) || 1,
    category: mapCategory(row.category),
    difficulty: mapDifficulty(row.difficulty),
    duration: row.duration || 'N/A',
    contributor: row.contributor || 'FACODI',
    tags: row.tags ?? [],
    courseId: row.course_id,
    courseCode: row.course_code ?? undefined,
    prerequisites: row.prerequisites ?? undefined,
    unitCode: row.unit_code ?? row.code ?? row.id,
    sectionName: row.section_name ?? undefined,
    websiteUrl: row.website_url ?? row.source_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
  };
}

function mapPlaylist(row: CatalogPlaylistRow, validUnitIds: Set<string>): Playlist | null {
  if (!row.id || !row.title || !row.unit_id || !validUnitIds.has(row.unit_id)) {
    return null;
  }

  const estimatedHours = row.total_duration_seconds
    ? Math.round((Number(row.total_duration_seconds) / 3600) * 10) / 10
    : 0;

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    title: row.title,
    description: row.description || `Caminho de aprendizado da unidade ${row.unit_code ?? row.unit_id}.`,
    units: [row.unit_id],
    estimatedHours,
    creator: 'FACODI Community',
    courseId: row.course_id ?? undefined,
    unitId: row.unit_id,
    course_code: row.course_code ?? undefined,
    unit_code: row.unit_code ?? undefined,
  };
}

export async function loadCatalogData(): Promise<CatalogPayload> {
  const sb = supabase.schema('facodi');

  const { data: coursesRaw, error: coursesErr } = await sb
    .from('v_catalog_courses')
    .select('*')
    .order('code', { ascending: true });

  if (coursesErr) throw new Error(`[catalogSource:facodi] courses: ${coursesErr.message}`);
  if (!coursesRaw?.length) throw new Error('[catalogSource:facodi] No published courses returned.');

  const courses = coursesRaw.map(mapCourse);
  const validCourseIds = new Set(courses.map((course) => course.id));

  const { data: unitsRaw, error: unitsErr } = await sb
    .from('v_catalog_units')
    .select('*')
    .order('course_code', { ascending: true })
    .order('year', { ascending: true })
    .order('semester', { ascending: true })
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  if (unitsErr) throw new Error(`[catalogSource:facodi] units: ${unitsErr.message}`);

  const units = (unitsRaw ?? []).map((row) => mapUnit(row, validCourseIds));
  const validUnitIds = new Set(units.map((unit) => unit.id));

  const { data: playlistsRaw, error: playlistsErr } = await sb
    .from('v_catalog_playlists')
    .select('*')
    .order('course_code', { ascending: true })
    .order('unit_code', { ascending: true })
    .order('title', { ascending: true });

  if (playlistsErr) throw new Error(`[catalogSource:facodi] playlists: ${playlistsErr.message}`);

  const playlists = (playlistsRaw ?? [])
    .map((row) => mapPlaylist(row, validUnitIds))
    .filter((playlist): playlist is Playlist => Boolean(playlist));

  return { source: 'facodi', courses, units, playlists };
}

export function findPlaylistForUnit(unit: CurricularUnit, playlists: Playlist[]): Playlist | null {
  return playlists.find((playlist) => playlist.unitId === unit.id || playlist.units.includes(unit.id)) ?? null;
}
