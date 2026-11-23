import { describe, expect, it } from 'vitest';
import { catalogReturnPath, safeExternalUrl, safeReturnPath } from '@/shared/lib/navigation';

describe('safe navigation', () => {
  it.each(['//evil.test', '/\\evil.test', 'https://evil.test', '/auth/callback', '/%2f%2fevil.test', '/admin\n', '/videos', '/login?next=/admin', '/sequences/a/b', '/resources/%2f%2fevil.test', '/resources/', '/modules/a/b', '/modules/%2f%2fevil.test'])('rejects unsafe or obsolete return destination %s', value => {
    expect(safeReturnPath(value)).toBe('/dashboard');
  });
  it('preserves approved internal destinations and search', () => {
    expect(safeReturnPath('/editor?view=courses')).toBe('/editor?view=courses');
    expect(safeReturnPath('/profile')).toBe('/profile');
    expect(safeReturnPath('/editor/study-paths?status=accepted')).toBe('/editor/study-paths?status=accepted');
    expect(safeReturnPath('/editor/course-quality')).toBe('/editor/course-quality');
    expect(safeReturnPath('/editor/sequence-order')).toBe('/editor/sequence-order');
    expect(safeReturnPath('/community/join')).toBe('/community/join');
    expect(safeReturnPath('/playlists/submit')).toBe('/playlists/submit');
    expect(safeReturnPath('/sequences/facodi-playlist-git?v=v1')).toBe('/sequences/facodi-playlist-git?v=v1');
    expect(safeReturnPath('/courses/ifes-cariacica-administracao-integrado-2026')).toBe('/courses/ifes-cariacica-administracao-integrado-2026');
    expect(safeReturnPath('/courses/ifes-cariacica-administracao-integrado-2026/units/matematica')).toBe('/courses/ifes-cariacica-administracao-integrado-2026/units/matematica');
    expect(safeReturnPath('/resources/intro-to-sql#timestamp-90')).toBe('/resources/intro-to-sql#timestamp-90');
    expect(safeReturnPath('/modules/algebra?notes=module#practice')).toBe('/modules/algebra?notes=module#practice');
    expect(safeReturnPath('//example.invalid/courses/ifes-cariacica-administracao-integrado-2026')).toBe('/dashboard');
    expect(safeReturnPath('/resources/intro-to-sql')).toBe('/resources/intro-to-sql');
  });
  it('permits HTTP resource links but not executable, local or credentialed URLs', () => {
    expect(safeExternalUrl('https://example.test/lesson')).toBe('https://example.test/lesson');
    for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:pass@example.test', 'bad']) expect(safeExternalUrl(value)).toBeUndefined();
  });
  it('only restores an internal origin for the expected catalogue', () => {
    const fallback = '/resources?type=module';
    expect(catalogReturnPath({ catalogReturn: '/resources?type=video&search=algebra&page=2#resource-library' }, fallback))
      .toBe('/resources?type=video&search=algebra&page=2#resource-library');
    for (const state of [null, {}, { catalogReturn: 1 }, { catalogReturn: '//evil.test/resources' },
      { catalogReturn: '/\\evil.test/resources' }, { catalogReturn: 'https://evil.test/resources' },
      { catalogReturn: '/resources/other' }, { catalogReturn: '/courses?search=algebra' }]) {
      expect(catalogReturnPath(state, fallback)).toBe(fallback);
    }
  });
});
