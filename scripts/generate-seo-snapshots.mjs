import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pt from '../src/i18n/locales/pt.json';
import { videoInfo } from '../src/entities/course/video.ts';
import {
  ABOUT_FAQ, aboutMeta, coursePath, courseMeta, homeMeta, metaDescription, publicResourcePath, resourceMeta, sequenceMeta,
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

async function writeSnapshot(shell, page, sections = []) {
  const file = snapshotFilePath(outputDirectory, page.path);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, renderSnapshotHtml(shell, page, sections), 'utf8');
}

/** Runs `task` over `items` with a small, fixed number of requests in flight. */
async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }));
  return results;
}

const plural = (key, count) => String(copy(`${key}_${count === 1 ? 'one' : 'other'}`)).replace('{{count}}', String(count));

const pages = new Map(staticPages.map(page => [page.path, page]));
// Titled groups of public links each snapshot exposes in plain HTML, so crawlers and answer engines can follow
// the catalogue graph (course → unit → videos and sequences → video → unit) without running JavaScript.
const sections = new Map();
const addSection = (pagePath, section) => {
  if (section.links.length) sections.set(pagePath, [...(sections.get(pagePath) ?? []), section]);
};
/** One section per title, links in first-seen order and without repeats. */
function mergeSections(list = []) {
  const merged = new Map();
  for (const section of list) {
    const key = section.title ?? '';
    const current = merged.get(key) ?? { ...section, links: [] };
    const seen = new Set(current.links.map(link => link.path));
    current.links.push(...section.links.filter(link => !seen.has(link.path) && seen.add(link.path)));
    merged.set(key, current);
  }
  return [...merged.values()];
}
const llmsCourses = [];
const llmsSequences = [];
const addPage = page => {
  if (pages.has(page.path)) throw new Error(`Duplicate public SEO snapshot route: ${page.path}`);
  pages.set(page.path, page);
};

if (isBuildPlaceholder) {
  console.warn('FACODI SEO snapshots: Supabase environment is a CI placeholder; generating static pages only.');
} else {
  const [courses, units, resources, sequenceResponse, relations] = await Promise.all([
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
    // Same public rows the SPA reads: unit trails use only approved links, module materials use every visible one.
    fetchRows('learning_object_relations', {
      select: 'parent_object_id,child_object_id,position,review_status:metadata->>review_status',
      relation_type: 'eq.contains', order: 'parent_object_id.asc,position.asc.nullslast,child_object_id.asc',
    }),
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
  const courseUnits = new Map();
  const publicUnits = [];
  for (const unit of units) {
    const course = Array.isArray(unit.courses) ? unit.courses[0] : unit.courses;
    if (!unit.slug || !course?.slug) continue;
    const page = unitMeta(unit, course, { courses: pt.nav.courses });
    addPage(page);
    publicUnits.push({ ...unit, page: page.path, name: page.title });
    const coursePage = coursePath(course.slug);
    courseUnits.set(coursePage, [...(courseUnits.get(coursePage) ?? []), { name: unit.title, path: page.path }]);
  }
  for (const [coursePage, list] of courseUnits) addSection(coursePage, { title: pt.catalog.units, links: list });
  addSection('/courses', { links: llmsCourses.map(({ name, path: href }) => ({ name, path: href })) });

  const sequenceSlugs = new Set(sequences.map(sequence => sequence.playlist_slug));
  const publicCourseObjectIds = new Set(courses.map(course => course.learning_object_id).filter(Boolean));
  const publicUnitObjectIds = new Set(units.map(unit => unit.learning_object_id).filter(Boolean));
  // Public page of each learning object, so relations can be written as plain links.
  const objectPages = new Map();
  for (const course of courses) if (course.learning_object_id) objectPages.set(course.learning_object_id, { name: course.title, path: coursePath(course.slug) });
  for (const unit of publicUnits) if (unit.learning_object_id) objectPages.set(unit.learning_object_id, { name: unit.name, path: unit.page });
  const resourcesById = new Map();
  for (const resource of resources) {
    resourcesById.set(resource.id, resource);
    if (resource.object_type === 'course' && publicCourseObjectIds.has(resource.id)) continue;
    if (resource.object_type === 'curricular_unit' && publicUnitObjectIds.has(resource.id)) continue;
    if (resource.object_type === 'playlist' && sequenceSlugs.has(resource.slug)) {
      objectPages.set(resource.id, { name: resource.title, path: sequencePath(resource.slug) });
      continue;
    }
    const page = resourceMeta(
      resource,
      resource.object_type === 'video' ? videoInfo(resource.metadata, resource.source_url) : null,
      { resources: pt.nav.resources, type: pt.objectTypes[resource.object_type] ?? resource.object_type },
    );
    addPage(page);
    objectPages.set(resource.id, { name: resource.title, path: page.path });
  }

  // Curated reading order: a unit's approved video trail, a module's materials, and the units containing each video.
  const childrenOf = new Map();
  const videoUnits = new Map();
  const unitObjectPages = new Map(publicUnits.filter(unit => unit.learning_object_id).map(unit => [unit.learning_object_id, unit.page]));
  const byPosition = (a, b) => a.parent_object_id.localeCompare(b.parent_object_id)
    || (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    || a.child_object_id.localeCompare(b.child_object_id);
  for (const relation of [...relations].sort(byPosition)) {
    const child = resourcesById.get(relation.child_object_id);
    const childPage = objectPages.get(relation.child_object_id);
    if (!child || !childPage) continue;
    const unitPage = unitObjectPages.get(relation.parent_object_id);
    if (unitPage) {
      if (relation.review_status !== 'approved' || child.object_type !== 'video') continue;
      childrenOf.set(relation.parent_object_id, [...(childrenOf.get(relation.parent_object_id) ?? []), childPage]);
      const parent = objectPages.get(relation.parent_object_id);
      videoUnits.set(childPage.path, [...(videoUnits.get(childPage.path) ?? []), parent]);
      continue;
    }
    if (resourcesById.get(relation.parent_object_id)?.object_type === 'module') {
      childrenOf.set(relation.parent_object_id, [...(childrenOf.get(relation.parent_object_id) ?? []), childPage]);
    }
  }
  const unique = list => [...new Map(list.map(link => [link.path, link])).values()];
  for (const unit of publicUnits) {
    if (unit.learning_object_id) addSection(unit.page, { title: pt.unit.resources, ordered: true, links: unique(childrenOf.get(unit.learning_object_id) ?? []) });
  }
  for (const resource of resources) {
    if (resource.object_type !== 'module') continue;
    const page = objectPages.get(resource.id);
    if (page) addSection(page.path, { title: pt.studyModules.materials, ordered: true, links: unique(childrenOf.get(resource.id) ?? []) });
  }
  for (const [videoPage, list] of videoUnits) addSection(videoPage, { title: pt.video.unit, links: unique(list) });

  // Each public sequence with its lessons in order, so the ItemList and the plain HTML match what people see.
  const sequenceDetails = await mapLimit(sequences, 6, async sequence => {
    const { data } = await request('rpc/get_public_editorial_playlist_v2', { method: 'POST', body: { p_slug: sequence.playlist_slug } });
    const row = Array.isArray(data) ? data[0] : null;
    return Array.isArray(row?.items) ? [...row.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : [];
  });
  const unitsByCode = new Map();
  for (const unit of publicUnits) if (unit.code) unitsByCode.set(unit.code, [...(unitsByCode.get(unit.code) ?? []), { name: unit.name, path: unit.page }]);
  const videoSequences = new Map();
  sequences.forEach((sequence, index) => {
    const items = sequenceDetails[index].map(item => {
      const resource = resourcesById.get(item.video_id);
      const page = resource ? objectPages.get(resource.id) : null;
      return { title: item.title ?? resource?.title ?? '', slug: page && resource ? resource.slug : null, youtubeId: item.youtube_id ?? null, page };
    });
    const path = sequencePath(sequence.playlist_slug);
    llmsSequences.push({ name: sequence.playlist_title, path, note: metaDescription(sequence.playlist_description, '', 200) });
    addPage(sequenceMeta({
      slug: sequence.playlist_slug,
      title: sequence.playlist_title,
      description: sequence.playlist_description,
      language: sequence.language,
      items: items.map(({ title, slug, youtubeId }) => ({ title, slug, youtubeId })),
      itemCount: sequence.item_count,
      coverYoutubeId: sequence.cover_youtube_id,
    }, { sequences: pt.sequences.title }));
    const lessons = unique(items.flatMap(item => (item.page ? [{ name: item.title || item.page.name, path: item.page.path }] : [])));
    addSection(path, { title: plural('sequences.lessons', lessons.length), ordered: true, links: lessons });
    const related = unique((Array.isArray(sequence.unit_codes) ? sequence.unit_codes : []).flatMap(code => unitsByCode.get(code) ?? []));
    addSection(path, { title: pt.sequences.units, links: related });
    for (const code of Array.isArray(sequence.unit_codes) ? sequence.unit_codes : []) {
      for (const unit of unitsByCode.get(code) ?? []) addSection(unit.path, { title: pt.sequences.title, links: [{ name: sequence.playlist_title, path }] });
    }
    for (const lesson of lessons) videoSequences.set(lesson.path, [...(videoSequences.get(lesson.path) ?? []), { name: sequence.playlist_title, path }]);
  });
  for (const [videoPage, list] of videoSequences) addSection(videoPage, { title: pt.sequences.inSequences, links: unique(list) });

  addSection('/sequences', { links: llmsSequences.map(({ name, path: href }) => ({ name, path: href })) });
  console.log(`FACODI SEO snapshots: ${courses.length} courses, ${units.length} units, ${resources.length} learning objects, ${sequences.length} sequences.`);
}

const shell = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
for (const page of pages.values()) {
  if (page.path !== '/') await writeSnapshot(shell, page, mergeSections(sections.get(page.path)));
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
