import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_IMAGE } from './seo';

const publicFile = (name: string) => join(process.cwd(), 'public', name);
const pngDimensions = (name: string) => {
  const data = readFileSync(publicFile(name));
  expect([...data.subarray(0, 8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect(data[25]).toBe(3); // Optimised indexed-colour PNG
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

describe('FACODI media', () => {
  it.each([
    ['favicon-16x16.png',16,16],
    ['favicon-32x32.png',32,32],
    ['favicon-64x64.png',64,64],
    ['apple-touch-icon.png',180,180],
    ['pwa-192x192.png',192,192],
    ['pwa-512x512.png',512,512],
    ['social-preview-default.png',1200,630],
  ])('ships a valid PNG with correct dimensions: %s', (file, width, height) => {
    expect(pngDimensions(file)).toEqual([width,height]);
  });

  it('uses FACODI as the canonical OG/Twitter preview with a stable cache version', () => {
    expect(DEFAULT_IMAGE.url).toBe('https://facodi.com/social-preview-default.png?v=20261115');
    expect(DEFAULT_IMAGE.width).toBe(1200);
    expect(DEFAULT_IMAGE.height).toBe(630);
    expect(existsSync(publicFile('social-preview-default.svg'))).toBe(true);
    expect(existsSync(publicFile('brand/o2t/README.md'))).toBe(false);
  });
});
