import { describe, expect, it } from 'vitest';
import { isYoutubePlaylistUrl, parsePlaylistVideoIds } from './playlistUtils';

describe('FACODI playlist URL validation', () => {
  it('accepts canonical YouTube playlist URLs', () => {
    expect(isYoutubePlaylistUrl('https://www.youtube.com/playlist?list=PL1234567890')).toBe(true);
    expect(isYoutubePlaylistUrl('https://music.youtube.com/playlist?list=PL1234567890')).toBe(true);
  });
  it('rejects lookalike domains, HTTP, missing lists and invalid IDs', () => {
    for (const url of [
      'https://youtube.com.attacker.example/playlist?list=PL1234567890',
      'http://www.youtube.com/playlist?list=PL1234567890',
      'https://www.youtube.com/playlist',
      'https://evil.example/?list=PL1234567890',
      'https://www.youtube.com/playlist?list=bad',
      'javascript:alert(1)',
      '',
    ]) expect(isYoutubePlaylistUrl(url)).toBe(false);
  });
});

describe('FACODI explicit YouTube IDs', () => {
  it('parses unique 11-character IDs from multiple separators', () => {
    expect(parsePlaylistVideoIds('dQw4w9WgXcQ, abcdefghijk\ndQw4w9WgXcQ'))
      .toEqual(['dQw4w9WgXcQ', 'abcdefghijk']);
  });
  it('returns an empty list for optional blank input', () => {
    expect(parsePlaylistVideoIds('  ')).toEqual([]);
  });
  it('rejects URLs and malformed IDs', () => {
    expect(() => parsePlaylistVideoIds('https://youtu.be/dQw4w9WgXcQ')).toThrow('invalid_youtube_video_ids');
    expect(() => parsePlaylistVideoIds('123')).toThrow('invalid_youtube_video_ids');
  });
  it('enforces a 100-entry cap', () => {
    const ids = Array.from({ length: 101 }, (_, i) => String(i).padStart(11, '0')).join('\n');
    expect(() => parsePlaylistVideoIds(ids)).toThrow('invalid_youtube_video_ids');
  });
}
