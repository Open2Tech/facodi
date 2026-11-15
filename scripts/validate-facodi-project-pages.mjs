import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const sitemap = read('public/sitemap.xml');
const robots = read('public/robots.txt');
const projectSeo = read('src/components/project/ProjectPageSeo.tsx');
const about = read('src/pages/About.tsx');
const community = read('src/pages/Community.tsx');
const admin = read('src/pages/EditorProjectCredits.tsx');

const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const required = [
  'https://www.facodi.com/',
  'https://www.facodi.com/courses',
  'https://www.facodi.com/units',
  'https://www.facodi.com/how-it-works',
  'https://www.facodi.com/resources',
  'https://www.facodi.com/sequences',
  'https://www.facodi.com/about',
  'https://www.facodi.com/community',
];
assert.deepEqual(urls, required, 'Public sitemap must not include private or unverified routes');
assert.match(robots, /Sitemap: https:\/\/www\.facodi\.com\/sitemap\.xml/);
for (const prefix of ['/login', '/auth', '/editor', '/admin', '/profile', '/dashboard', '/suggest']) {
  assert.ok(robots.includes(`Disallow: ${prefix}`), `Private route missing from robots: ${prefix}`);
}
assert.ok(projectSeo.includes('rel="canonical"'), 'Project SEO requires canonical URLs');
assert.ok(projectSeo.includes('application/ld+json'), 'Project SEO must include structured metadata');
assert.ok(about.includes('<ProjectPageSeo page="about"'), 'About must install route-specific SEO');
assert.ok(community.includes('<ProjectPageSeo page="community"'), 'Community must install route-specific SEO');
assert.ok(admin.includes("supabase.rpc('revoke_project_credit'"), 'Editor must offer revocation workflow');

for (const lang of ['pt', 'en', 'es', 'fr']) {
  const dict = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  for (const page of ['about', 'community']) {
    const meta = dict.projectSeo?.[page];
    assert.ok(meta && meta.title.length >= 20 && meta.description.length >= 75,
      `Missing translated SEO for ${lang} / ${page}`);
  }
  for (const key of ['approvedTitle','withdrawAction','withdrawConfirm',
      'withdrawReason','withdrawAcknowledge','withdrawConfirmButton','withdrawSuccess']) {
    assert.ok(dict.projectCredits?.[key]?.trim(),
      `Missing consent withdrawal copy: ${lang} / ${key}`);
  }
}

const join = read('src/pages/CommunityJoin.tsx');
const editorialCommunity = read('src/pages/EditorCommunity.tsx');
const routes = read('src/App.tsx');
const layout = read('src/components/layout/FacodiLayout.tsx');
assert.ok(join.includes("supabase.from('community_participation_requests')"), 'Missing Supabase community intake');
assert.ok(join.includes('consent_to_contact: true'), 'Community intake must require opt-in');
assert.ok(join.includes(".delete().eq('id', id).eq('submitted_by', user.id)"),
  'Contributors must be able to delete only their own proposals');
assert.ok(editorialCommunity.includes(".eq('review_status','pending')"),
  'Editor queue must filter to pending private proposals');
assert.ok(editorialCommunity.includes("review_status: action"), 'Editor queue needs auditable review');
assert.ok(routes.includes('path="/community/join"'), 'Missing private join route');
assert.ok(routes.includes('path="/editor/community"'), 'Missing editor review route');
assert.ok(community.includes("'/community/join'"), 'Community CTA must lead to opt-in intake');
assert.ok(layout.includes("location.pathname.startsWith('/community/join')"),
  'Private join route must not be indexed');
for (const code of [join,editorialCommunity]) {
  assert.ok(!/sendEmail|send_draft|supabase.functions.invoke\(['"]send|email_outbox/i.test(code),
    'Community interest flow must not dispatch any emails');
}
for (const lang of ['pt','en','es','fr']) {
  const dict = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  for (const key of ['consent','privacy','withdraw','withdrawConfirm','withdrawConfirmButton',
    'reviewPrivacy','reviewDescription','status']) {
    assert.ok(dict.communityJoin?.[key], `Community copy missing: ${lang}/${key}`);
  }
}


const wrangler = JSON.parse(read('wrangler.jsonc'));
const vercelConfig = JSON.parse(read('vercel.json'));
assert.equal(vercelConfig.git?.deploymentEnabled, false,
  'FACODI frontend is deployed on Cloudflare Workers; Vercel Git deployments must remain disabled');
const workerHeaders = read('public/_headers');
const supabaseConfig = read('supabase/config.toml');
const facodiPlaylistFunction = read('supabase/functions/facodi-submit-playlist/index.ts');
assert.equal(wrangler.name, 'facodi', 'Cloudflare must deploy the FACODI Worker');
assert.equal(wrangler.assets?.directory, './dist', 'Cloudflare must serve the Vite dist assets');
assert.equal(wrangler.assets?.not_found_handling, 'single-page-application',
  'Client-side routes and Auth callbacks require Cloudflare SPA fallback');
assert.ok(workerHeaders.includes('https://facodi.marcelo-0d6.workers.dev/*') &&
  workerHeaders.includes('X-Robots-Tag: noindex, nofollow, noarchive'),
  'Cloudflare Workers preview host must not be indexed');
for (const rule of ['X-Content-Type-Options: nosniff','X-Frame-Options: DENY',
  'Referrer-Policy: strict-origin-when-cross-origin']) {
  assert.ok(workerHeaders.includes(rule), `Missing Cloudflare security header: ${rule}`);
}
assert.ok(workerHeaders.includes('/assets/*') &&
  workerHeaders.includes('max-age=31536000, immutable'),
  'Hashed Vite assets must have durable cache behavior');
assert.ok(supabaseConfig.includes('site_url = "https://tube.open2.tech"'),
  'Shared Auth Site URL must remain unchanged without a separate Auth setup');
for (const route of ['/auth/callback**','/auth/reset-password**']) {
  assert.ok(supabaseConfig.includes(`https://facodi.marcelo-0d6.workers.dev${route}`),
    `Workers preview missing versioned Auth redirect: ${route}`);
}
assert.ok(facodiPlaylistFunction.includes('"facodi.marcelo-0d6.workers.dev"') &&
  !facodiPlaylistFunction.includes('".marcelo-0d6.workers.dev"'),
  'FACODI playlist API must permit only the exact Workers preview origin');
assert.ok(!JSON.stringify(wrangler).match(/service.role|secret|SUPABASE_SERVICE/i),
  'Cloudflare configuration must not expose server secrets');


// Learning organization: public-first, accessible, localized and not misleading.
const moduleApi = read('src/entities/module/module.api.ts');
const moduleCatalog = read('src/pages/Resources.tsx');
const moduleDetails = read('src/pages/ModuleDetails.tsx');
const learningGuide = read('src/components/learning/LearningPathGuide.tsx');
const unitDetails = read('src/pages/UnitDetails.tsx');
const home = read('src/pages/Home.tsx');
const publicSequences = read('src/pages/Sequences.tsx');
const linkedAssets = read('src/features/courses/queries/useLinkedCatalogAssets.ts');
for (const path of ['/modules','/modules/:slug','/how-it-works']) {
  assert.ok(routes.includes(`path="${path}"`), `Missing public learning route ${path}`);
}
assert.ok(moduleApi.includes(".eq('object_type', 'module').eq('published', true).eq('status', 'active')"),
  'Module catalog must query only public active modules');
assert.ok(moduleApi.includes(".eq('published', true).eq('status', 'active')"),
  'Module children must be published and active under RLS');
assert.ok(moduleCatalog.includes('moduleOnly') && moduleCatalog.includes('moduleResourcePath(') &&
  moduleCatalog.includes('<LearningContext focus="resource"'),
  'Unified resource catalog must filter modules and route to module details');
assert.ok(routes.includes('LegacyModulesRedirect') && learningGuide.includes('/resources?type=module'),
  'Legacy module listing must redirect while learning guidance points to the unified catalog');
assert.ok(!layout.includes("to: '/modules'"), 'Primary navigation must not link to the retired listing');
assert.ok(moduleDetails.includes('moduleResourcePath(') &&
  moduleDetails.includes('linkedUnits') &&
  moduleDetails.includes('activity_prompt'),
  'Module details need verified links, curricular context and optional self-study exercises');
assert.ok(linkedAssets.includes("'module'"), 'UC-linked assets must support module objects');
assert.ok(unitDetails.includes('modulesQuery') && unitDetails.includes('/modules/'),
  'Curricular units must display real related study modules');
assert.ok(home.includes('<LearningPathGuide compact'), 'Homepage must include a concise study map');
assert.ok(publicSequences.includes('<LearningContext focus="sequence"'),
  'Editorial sequences must be explained as a distinct feature');
for (const lang of ['pt','en','es','fr']) {
  const copy = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  for (const part of ['course','unit','module','sequence']) {
    assert.ok(copy.learningGuide?.parts?.[part]?.short &&
      copy.learningGuide?.context?.[part],
      `Missing learning hierarchy explanation: ${lang}/${part}`);
  }
  for (const key of ['disclaimer','practiceNotice','forUnit','forUnitText',
      'materialsDescription']) {
    assert.ok(copy.studyModules?.[key], `Missing module learning disclosure: ${lang}/${key}`);
  }
  assert.ok(copy.nav?.modules, `Missing module navigation label in ${lang}`);
}
assert.ok(learningGuide.includes('aria-labelledby="learning-path-guide"') &&
  learningGuide.includes('t(\'learningGuide.reuseNote\')'),
  'Learning guide needs semantic section heading and reusable-content explanation');

console.log('FACODI project, community, SEO and consent checks passed across four locales.');
