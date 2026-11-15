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
  'https://www.facodi.com/resources',
  'https://www.facodi.com/sequences',
  'https://www.facodi.com/about',
  'https://www.facodi.com/community',
];
assert.deepEqual(urls, required, 'Public sitemap must not include private or unverified routes');
assert.match(robots, /Sitemap: https:\/\/facodi\.vercel\.app\/sitemap\.xml/);
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

console.log('FACODI project, community, SEO and consent checks passed across four locales.');
