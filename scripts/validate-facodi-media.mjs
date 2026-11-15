import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../public/', import.meta.url);
const specs = [
  ['favicon-16x16.png',16,16],
  ['favicon-32x32.png',32,32],
  ['favicon-64x64.png',64,64],
  ['apple-touch-icon.png',180,180],
  ['pwa-192x192.png',192,192],
  ['pwa-512x512.png',512,512],
  ['social-preview-default.png',1200,630],
];
const publicFile = name => new URL(name, root);
for (const [name,width,height] of specs) {
  const data = readFileSync(publicFile(name));
  assert.deepEqual([...data.subarray(0,8)], [137,80,78,71,13,10,26,10], name+': PNG signature');
  assert.equal(data.readUInt32BE(16),width,name+': width');
  assert.equal(data.readUInt32BE(20),height,name+': height');
  assert.equal(data[25],3,name+': indexed colour PNG');
  assert.ok(data.length < 300_000,name+': image payload');
}
for (const filename of ['favicon.svg','social-preview-default.svg']) {
  const xml = readFileSync(publicFile(filename),'utf8');
  assert.match(xml,/<svg\s/,filename+': vector asset');
  assert.doesNotMatch(xml,/tube[-.]|o2t-logo|<script|https?:\/\//i,filename+': no legacy branding/external loads');
}
const manifest = JSON.parse(readFileSync(publicFile('site.webmanifest'),'utf8'));
for (const icon of manifest.icons) {
  assert.ok(existsSync(publicFile(icon.src.replace(/^\//,''))),icon.src+': installed icon');
}
assert.ok(!existsSync(publicFile('brand/o2t/README.md')),'legacy O2T brand removed');
const seo = readFileSync(new URL('../src/shared/seo/seo.ts', import.meta.url),'utf8');
assert.match(seo,/social-preview-default\.png\?v=20261115/,'SEO versioned image');
const html = readFileSync(new URL('../index.html', import.meta.url),'utf8');
assert.match(html,/og:image" content="https:\/\/facodi\.com\/social-preview-default\.png\?v=20261115"/,'Open Graph');
assert.match(html,/twitter:image" content="https:\/\/facodi\.com\/social-preview-default\.png\?v=20261115"/,'Twitter preview');
console.log('FACODI: 7 PNG + 2 SVG assets, manifest, OG/Twitter links validated.');
