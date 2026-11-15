import { describe, expect, it } from 'vitest';
import pt from '@/i18n/locales/pt.json';
import indexHtml from '../../../index.html?raw';
import { headTags, homeMeta, metaDescription, renderHeadTags, resourceMeta, unitMeta } from './seo';

const find = (tags: ReturnType<typeof headTags>, key: string) =>
  tags.find(tag => (tag.tag === 'meta' && (tag.name === key || tag.property === key)) || (tag.tag === 'link' && tag.rel === key));

describe('page metadata', () => {
  it('cuts long plain-text descriptions on a word boundary', () => {
    const text = metaDescription(`<p>${'palavra '.repeat(40)}</p>`);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/palavra…$/);
    expect(metaDescription('  ', 'Fallback &amp; more')).toBe('Fallback & more');
  });

  it('gives indexable pages a canonical on facodi.com and noindex pages none', () => {
    const page = unitMeta({ slug: 'calculo', title: 'Cálculo', summary: null, language: 'pt-BR' }, { slug: 'lesti', title: 'LESTI' }, { courses: 'Cursos' });
    const tags = headTags(page);
    expect(find(tags, 'canonical')).toMatchObject({ href: 'https://facodi.com/courses/lesti/units/calculo' });
    expect(find(tags, 'og:locale')).toMatchObject({ content: 'pt_BR' });
    expect(find(tags, 'description')).toMatchObject({ content: 'Cálculo — LESTI' });
    const hidden = headTags({ ...page, noindex: true });
    expect(find(hidden, 'canonical')).toBeUndefined();
    expect(find(hidden, 'robots')).toMatchObject({ content: 'noindex, follow' });
  });

  it('describes videos with their YouTube still and modules at their own route', () => {
    const video = resourceMeta({ slug: 'v', title: 'Aula', object_type: 'video', description: null }, { youtubeId: 'abcdefghijk', durationSeconds: 90 }, { resources: 'Recursos', type: 'Vídeo' });
    expect(video.type).toBe('video.other');
    expect(video.image?.url).toBe('https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
    expect(video.jsonLd?.[0]).toMatchObject({ '@type': 'VideoObject', duration: 'PT90S' });
    const module = resourceMeta({ slug: 'm 1', title: 'Módulo', object_type: 'module' }, null, { resources: 'Recursos', type: 'Módulo' });
    expect(module.path).toBe('/modules/m%201');
    expect(module.image).toBeNull();
  });

  it('never lets catalogue text close the JSON-LD script', () => {
    const tags = headTags({ title: 'x', description: 'x', path: '/', jsonLd: [{ name: '</script><script>alert(1)</script>' }] });
    const html = renderHeadTags(tags);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });

  it('keeps the SPA shell in index.html in sync with the home descriptor', () => {
    const shell = indexHtml.match(/<!-- seo:start[^>]*-->\s*([\s\S]*?)\s*<!-- seo:end -->/)?.[1];
    // The shell also serves the SPA fallback, so it carries no canonical or og:url.
    const expected = renderHeadTags(headTags(homeMeta({ title: `FACODI — ${pt.brand.tagline}`, description: pt.brand.description }))
      .filter(tag => !(tag.tag === 'link' && tag.rel === 'canonical') && !(tag.tag === 'meta' && tag.property === 'og:url')));
    expect(shell).toBe(expected);
  });
});
