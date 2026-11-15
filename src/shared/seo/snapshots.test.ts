import { describe, expect, it } from 'vitest';
import { assertCompleteSequenceSnapshot, renderSitemap, renderSnapshotHtml, snapshotFilePath } from './snapshots';

describe('build-time SEO snapshots', () => {
  it('writes extensionless Worker routes as sibling .html files', () => {
    expect(snapshotFilePath('dist', '/courses/lesti')).toBe('dist/courses/lesti.html');
    expect(snapshotFilePath('dist/', '/courses/lesti%20test')).toBe('dist/courses/lesti test.html');
    expect(snapshotFilePath('dist', '/courses/educa%C3%A7%C3%A3o')).toBe('dist/courses/educação.html');
    expect(() => snapshotFilePath('dist', '/courses/../index')).toThrow('Unsafe SEO snapshot path');
    expect(() => snapshotFilePath('dist', '/courses/%2Fprivate')).toThrow('Unsafe SEO snapshot path');
  });

  it('replaces only the shell metadata block with the requested page metadata', () => {
    const shell = '<head><!-- seo:start old -->old tags<!-- seo:end --><meta name="theme-color" content="blue"></head>';
    const html = renderSnapshotHtml(shell, {
      title: 'LESTI', description: 'Curso público.', path: '/courses/lesti',
    });
    expect(html).toContain('<title data-seo-shell>LESTI — FACODI</title>');
    expect(html).toContain('<link data-seo-shell rel="canonical" href="https://facodi.com/courses/lesti" />');
    expect(html).toContain('<meta name="theme-color" content="blue">');
    expect(html).not.toContain('old tags');
    expect(() => renderSnapshotHtml('<head></head>', {
      title: 'Missing block', description: 'Invalid shell.', path: '/',
    })).toThrow('missing its seo:start/end block');
  });

  it('inserts dollar sequences in metadata literally without duplicating the shell', () => {
    const shell = '<head><!-- seo:start old -->old tags<!-- seo:end --><meta name="theme-color" content="blue"></head>';
    const html = renderSnapshotHtml(shell, {
      title: "Custo $& $' $` $$", description: 'Curso público.', path: '/courses/custo',
    });
    expect(html).toContain("<title data-seo-shell>Custo $&amp; $' $` $$ — FACODI</title>");
    expect(html.match(/<meta name="theme-color"/g)).toHaveLength(1);
    expect(html).not.toContain('old tags');
  });

  it('rejects capped, truncated, or unverifiable public sequence responses', () => {
    expect(() => assertCompleteSequenceSnapshot([], '*/0')).not.toThrow();
    expect(() => assertCompleteSequenceSnapshot(Array(499), '0-498/499')).not.toThrow();
    expect(() => assertCompleteSequenceSnapshot(Array(500), '0-499/500')).toThrow('500-row limit');
    expect(() => assertCompleteSequenceSnapshot(Array(10), '0-9/90')).toThrow('incomplete');
    expect(() => assertCompleteSequenceSnapshot([], null)).toThrow('exact count');
    expect(() => assertCompleteSequenceSnapshot({}, '*/0')).toThrow('Unexpected response');
  });

  it('deduplicates canonical URLs and XML-escapes sitemap entries', () => {
    expect(renderSitemap(['/courses/lesti', '/courses/lesti?from=search', '/resources/a&b'])).toBe([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>https://facodi.com/courses/lesti</loc></url>',
      '  <url><loc>https://facodi.com/resources/a&amp;b</loc></url>',
      '</urlset>',
      '',
    ].join('\n'));
  });
});
