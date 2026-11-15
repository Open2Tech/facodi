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
  'https://facodi.vercel.app/',
  'https://facodi.vercel.app/courses',
  'https://facodi.vercel.app/units',
  'https://facodi.vercel.app/resources',
  'https://facodi.vercel.app/sequences',
  'https://facodi.vercel.app/about',
  'https://facodi.vercel.app/community',
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
process.stdout.write('FACODI public project/SEO/consent checks passed (4 locales, 7 public URLs).\n');
