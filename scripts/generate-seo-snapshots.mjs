import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pt from '../src/i18n/locales/pt.json';
import { videoInfo } from '../src/entities/course/video.ts';
import {
  ABOUT_FAQ, aboutMeta, coursePath, courseMeta, homeMeta, metaDescription, resourceMeta, sequenceMeta,
  sequencePath, staticPageMeta, unitMeta, unitPagePath,
} from '../src/shared/seo/seo.ts';
import {
  assertCompleteSequenceSnapshot, exactSnapshotCount, renderLlmsTxt, renderSitemap, renderSnapshotHtml, snapshotFilePath,
} from '../src/shared/seo/snapshots.ts';

const outputDirectory = path.resolve('dist');
const copy = key => key.split('.').reduce((value, part) => value?.[part], pt);
const aboutFaq = ABOUT_FAQ.map(item => ({ question: copy(item.question), answer: copy(item.answer) }))
  .filter(item => typeof item.question === 'string' && typeof item.answer === 'string');
const staticPages = [
  homeMeta({ title: `FACODI — ${pt.brand.tagline}`, description: pt.brand.description }),
  staticPageMeta('/courses', { title: pt.nav.courses, description: pt.catalog.description }),
  staticPageMeta('/units', { title: pt.units.title, description: pt.units.description }),
  staticPageMeta('/how-it-works', { title: pt.learningGuide.pageTitle, description: pt.learningGuide.pageDescription }),
  staticPageMeta('/resources', { title: pt.resources.title, description: pt.resources.description }),
  staticPageMeta('/sequences', { title: pt.sequences.title, description: pt.sequences.description }),
  aboutMeta(pt.projectSeo.about, aboutFaq),
  staticPageMeta('/community', pt.projectSeo.community),
  ...['privacy', 'terms', 'cookies', 'copyright', 'accessibility', 'legal']
    .map(document => staticPageMeta(`/${document}`, { title: pt.legal[document].title, description: pt.legal[document].description })),
];

const envUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!envUrl || !publishableKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for SEO snapshots.');
}
let projectUrl;
try {
  projectUrl = new URL(envUrl);
} catch {
  throw new Error('VITE_SUPABASE_URL must be a valid HTTP(S) URL for SEO snapshots.');
}
if (!['http:', 'https:'].includes(projectUrl.protocol)) {
  throw new Error('VITE_SUPABASE_URL must be a valid HTTP(S) URL for SEO snapshots.');
}

const isBuildPlaceholder = projectUrl.hostname.endsWith('.invalid');

async function request(pathname, { method = 'GET', query = {}, body, count = false } = {}) {
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
  if (count) headers.Prefer = 'count=exact';
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SEO snapshot request ${method} ${url.pathname} failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return { data: await response.json(), contentRange: response.headers.get('content-range') };
}

async function fetchRows(table, filters) {
  const pageSize = 500;
  const rows = [];
  let expectedTotal;
  for (;;) {
    const { data: page, contentRange } = await request(table, {
      query: { ...filters, limit: String(pageSize), offset: String(rows.length) },
      count: true,
    });
    if (!Array.isArray(page)) throw new Error(`Unexpected response while reading public ${table}.`);
    const total = exactSnapshotCount(contentRange, `public ${table}`);
    if (expectedTotal !== undefined && total !== expectedTotal) {
      throw new Error(`Public ${table} changed during snapshot generation; retry the build.`);
    }
    expectedTotal = total;
    if (rows.length + page.length > total || (!page.length && rows.length < total)) {
      throw new Error(`Incomplete response while reading public ${table}.`);
    }
    rows.push(...page);
    if (rows.length === total) return rows;
  }
}

async function writeSnapshot(shell, page, pageLinks = []) {
  const file = snapshotFilePath(outputDirectory, page.path);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, renderSnapshotHtml(shell, page, pageLinks), 'utf8');
}

const pages = new Map(staticPages.map(page => [page.path, page]));
// Public links each snapshot exposes in plain HTML, so crawlers can follow the catalogue without JavaScript.
const links = new Map();
const llmsCourses = [];
const llmsSequences = [];
const addPage = page => {
  if (pages.has(page.path)) throw new Error(`Duplicate public SEO snapshot route: ${page.path}`);
  pages.set(page.path, page);
};

if (isBuildPlaceholder) {
  console.warn('FACODI SEO snapshots: Supabase environment is a CI placeholder; generating static pages only.');
} else {
  const [courses, units, resources, sequenceResponse] = await Promise.all([
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
    request('rpc/list_public_editorial_sequences_v1', { method: 'POST', body: {}, count: true }),
  ]);

  const { data: sequences, contentRange } = sequenceResponse;
  assertCompleteSequenceSnapshot(sequences, contentRange);
  if (!courses.length && !units.length && !resources.length && !sequences.length) {
    throw new Error('Supabase returned no public catalogue rows; refusing to publish a static-only sitemap for a configured project.');
  }

  for (const course of courses) {
    addPage(courseMeta(course, { courses: pt.nav.courses }));
    llmsCourses.push({ name: course.title, path: coursePath(course.slug), note: [course.institution, metaDescription(course.summary, '', 200)].filter(Boolean).join(' — ') });
  }
  for (const unit of units) {
    const course = Array.isArray(unit.courses) ? unit.courses[0] : unit.courses;
    if (!unit.slug || !course?.slug) continue;
    addPage(unitMeta(unit, course, { courses: pt.nav.courses }));
    const coursePage = coursePath(course.slug);
    links.set(coursePage, [...(links.get(coursePage) ?? []), { name: unit.title, path: unitPagePath(course.slug, unit.slug) }]);
  }
  links.set('/courses', llmsCourses.map(({ name, path: href }) => ({ name, path: href })));

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
    llmsSequences.push({ name: sequence.playlist_title, path: sequencePath(sequence.playlist_slug), note: metaDescription(sequence.playlist_description, '', 200) });
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

  links.set('/sequences', llmsSequences.map(({ name, path: href }) => ({ name, path: href })));
  console.log(`FACODI SEO snapshots: ${courses.length} courses, ${units.length} units, ${resources.length} learning objects, ${sequences.length} sequences.`);
}

const shell = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
for (const page of pages.values()) {
  if (page.path !== '/') await writeSnapshot(shell, page, links.get(page.path));
}

const staticLink = page => ({ name: page.title, path: page.path, note: page.description });
const llmsTxt = renderLlmsTxt(
  { summary: pt.brand.description, details: [pt.about.seaeuScope, pt.about.principles.open.text, pt.about.principles.curated.text] },
  [
    { title: pt.footer.learn, links: staticPages.filter(page => ['/courses', '/units', '/resources', '/sequences', '/how-it-works'].includes(page.path)).map(staticLink) },
    { title: pt.nav.courses, links: llmsCourses },
    { title: pt.sequences.title, links: llmsSequences },
    { title: pt.footer.project, links: staticPages.filter(page => ['/about', '/community'].includes(page.path)).map(staticLink) },
  ],
);
await writeFile(path.join(outputDirectory, 'llms.txt'), llmsTxt, 'utf8');
await writeFile(path.join(outputDirectory, 'sitemap.xml'), renderSitemap([...pages.keys()]), 'utf8');
console.log(`FACODI SEO snapshots: wrote ${pages.size - 1} HTML snapshots, ${pages.size} sitemap URLs and llms.txt.`);
