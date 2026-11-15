import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pt from '../src/i18n/locales/pt.json';
import { videoInfo } from '../src/entities/course/video.ts';
import {
  courseMeta, homeMeta, resourceMeta, sequenceMeta,
  staticPageMeta, unitMeta,
} from '../src/shared/seo/seo.ts';
import { renderSitemap, renderSnapshotHtml, snapshotFilePath } from '../src/shared/seo/snapshots.ts';

const outputDirectory = path.resolve('dist');
const staticPages = [
  homeMeta({ title: `FACODI — ${pt.brand.tagline}`, description: pt.brand.description }),
  staticPageMeta('/courses', { title: pt.nav.courses, description: pt.catalog.description }),
  staticPageMeta('/units', { title: pt.units.title, description: pt.units.description }),
  staticPageMeta('/how-it-works', { title: pt.learningGuide.pageTitle, description: pt.learningGuide.pageDescription }),
  staticPageMeta('/resources', { title: pt.resources.title, description: pt.resources.description }),
  staticPageMeta('/sequences', { title: pt.sequences.title, description: pt.sequences.description }),
  staticPageMeta('/about', pt.projectSeo.about),
  staticPageMeta('/community', pt.projectSeo.community),
];

const envUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let projectUrl;
try {
  projectUrl = envUrl ? new URL(envUrl) : null;
} catch {
  projectUrl = null;
}

const isBuildPlaceholder = !projectUrl || !publishableKey || projectUrl.hostname.endsWith('.invalid');

async function request(pathname, { method = 'GET', query = {}, body } = {}) {
  const url = new URL(`/rest/v1/${pathname}`, projectUrl);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const headers = {
    apikey: publishableKey,
    authorization: `Bearer ${publishableKey}`,
    'Accept-Profile': 'facodi',
  };
  if (method !== 'GET') {
    headers['Content-Profile'] = 'facodi';
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SEO snapshot request ${method} ${url.pathname} failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json();
}

async function fetchRows(table, filters) {
  const pageSize = 500;
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await request(table, { query: { ...filters, limit: String(pageSize), offset: String(offset) } });
    if (!Array.isArray(page)) throw new Error(`Unexpected response while reading public ${table}.`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function writeSnapshot(shell, page) {
  const file = snapshotFilePath(outputDirectory, page.path);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, renderSnapshotHtml(shell, page), 'utf8');
}

const pages = new Map(staticPages.map(page => [page.path, page]));
const addPage = page => {
  if (pages.has(page.path)) throw new Error(`Duplicate public SEO snapshot route: ${page.path}`);
  pages.set(page.path, page);
};

if (isBuildPlaceholder) {
  console.warn('FACODI SEO snapshots: Supabase environment is a CI placeholder; generating static pages only.');
} else {
  const [courses, units, resources, sequences] = await Promise.all([
    fetchRows('courses', {
      select: 'slug,title,summary,description_html,code,language,institution,ects_total,learning_object_id',
      published: 'eq.true', status: 'eq.active', order: 'slug.asc',
    }),
    fetchRows('curricular_units', {
      select: 'slug,title,summary,description_html,code,language,ects,learning_object_id,courses!inner(slug,title,institution,published,status)',
      slug: 'not.is.null', status: 'eq.active', 'courses.published': 'eq.true', 'courses.status': 'eq.active', order: 'slug.asc',
    }),
    fetchRows('learning_objects', {
      select: 'id,slug,title,description,object_type,language,tags,metadata,source_url',
      published: 'eq.true', status: 'in.(active,published)', order: 'slug.asc',
    }),
    request('rpc/list_public_editorial_sequences_v1', { method: 'POST', body: {} }),
  ]);

  if (!Array.isArray(sequences)) throw new Error('Unexpected response while reading public editorial sequences.');
  if (!courses.length && !units.length && !resources.length && !sequences.length) {
    throw new Error('Supabase returned no public catalogue rows; refusing to publish a static-only sitemap for a configured project.');
  }

  for (const course of courses) addPage(courseMeta(course, { courses: pt.nav.courses }));
  for (const unit of units) {
    const course = Array.isArray(unit.courses) ? unit.courses[0] : unit.courses;
    if (unit.slug && course?.slug) addPage(unitMeta(unit, course, { courses: pt.nav.courses }));
  }

  const sequenceSlugs = new Set(sequences.map(sequence => sequence.playlist_slug));
  const publicCourseObjectIds = new Set(courses.map(course => course.learning_object_id).filter(Boolean));
  const publicUnitObjectIds = new Set(units.map(unit => unit.learning_object_id).filter(Boolean));
  for (const resource of resources) {
    if (resource.object_type === 'course' && publicCourseObjectIds.has(resource.id)) continue;
    if (resource.object_type === 'curricular_unit' && publicUnitObjectIds.has(resource.id)) continue;
    if (resource.object_type === 'playlist' && sequenceSlugs.has(resource.slug)) continue;
    const page = resourceMeta(
      resource,
      resource.object_type === 'video' ? videoInfo(resource.metadata, resource.source_url) : null,
      { resources: pt.nav.resources, type: pt.objectTypes[resource.object_type] ?? resource.object_type },
    );
    addPage(page);
  }

  for (const sequence of sequences) {
    addPage(sequenceMeta({
      slug: sequence.playlist_slug,
      title: sequence.playlist_title,
      description: sequence.playlist_description,
      language: sequence.language,
      items: [],
      itemCount: sequence.item_count,
      coverYoutubeId: sequence.cover_youtube_id,
    }, { sequences: pt.sequences.title }));
  }

  console.log(`FACODI SEO snapshots: ${courses.length} courses, ${units.length} units, ${resources.length} learning objects, ${sequences.length} sequences.`);
}

const shell = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
for (const page of pages.values()) {
  if (page.path !== '/') await writeSnapshot(shell, page);
}
await writeFile(path.join(outputDirectory, 'sitemap.xml'), renderSitemap([...pages.keys()]), 'utf8');
console.log(`FACODI SEO snapshots: wrote ${pages.size - 1} HTML snapshots and ${pages.size} sitemap URLs.`);
