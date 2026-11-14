import { describe, expect, it } from 'vitest';
import { safeExternalUrl, safeReturnPath } from '@/shared/lib/navigation';

describe('safe navigation', () => {
  it.each(['//evil.test', '/\\evil.test', 'https://evil.test', '/auth/callback', '/%2f%2fevil.test', '/admin\n', '/videos', '/login?next=/admin', '/sequences/a/b', '/resources/%2f%2fevil.test', '/resources/'])('rejects unsafe or obsolete return destination %s', value => {
    expect(safeReturnPath(value)).toBe('/dashboard');
  });
  it('preserves approved internal destinations and search', () => {
    expect(safeReturnPath('/editor?view=courses')).toBe('/editor?view=courses');
    expect(safeReturnPath('/profile')).toBe('/profile');
    expect(safeReturnPath('/editor/study-paths?status=accepted')).toBe('/editor/study-paths?status=accepted');
    expect(safeReturnPath('/playlists/submit')).toBe('/playlists/submit');
    expect(safeReturnPath('/sequences/facodi-playlist-git?v=v1')).toBe('/sequences/facodi-playlist-git?v=v1');
    expect(safeReturnPath('/resources/intro-to-sql')).toBe('/resources/intro-to-sql');
  });
  it('permits HTTP resource links but not executable, local or credentialed URLs', () => {
    expect(safeExternalUrl('https://example.test/lesson')).toBe('https://example.test/lesson');
    for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:pass@example.test', 'bad']) expect(safeExternalUrl(value)).toBeUndefined();
  });
});
