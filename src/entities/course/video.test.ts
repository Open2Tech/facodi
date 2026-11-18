import { describe, expect, it } from 'vitest';
import { formatDuration, isoDuration, validDay, videoInfo, youtubeIdFromUrl, youtubePlaylistIdFromUrl } from '@/entities/course/video';

describe('video metadata', () => {
  it('extracts ids from supported YouTube URL shapes and rejects everything else', () => {
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
    expect(youtubeIdFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeIdFromUrl('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeIdFromUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeIdFromUrl('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeIdFromUrl('https://youtu.be/short')).toBeNull();
    expect(youtubeIdFromUrl('not a url')).toBeNull();
  });

  it('accepts only genuine https YouTube playlist URLs with a valid PL identifier', () => {
    const id = 'PLfcJAZC7MecVelrqxfn_kdiHvRGwWlwOy';
    expect(youtubePlaylistIdFromUrl(`https://www.youtube.com/playlist?list=${id}`)).toBe(id);
    expect(youtubePlaylistIdFromUrl(`https://m.youtube.com/playlist?list=${id}&index=3`)).toBe(id);
    expect(youtubePlaylistIdFromUrl(`https://youtube.com/playlist?list=${id}`)).toBe(id);
    expect(youtubePlaylistIdFromUrl(`https://evil.example/playlist?list=${id}`)).toBeNull();
    expect(youtubePlaylistIdFromUrl(`http://youtube.com/playlist?list=${id}`)).toBeNull();
    expect(youtubePlaylistIdFromUrl(`https://youtube.com/watch?v=abcdefghijk&list=${id}`)).toBeNull();
    expect(youtubePlaylistIdFromUrl('https://youtube.com/playlist?list=unsafe<script>')).toBeNull();
    expect(youtubePlaylistIdFromUrl('')).toBeNull();
  });

  it('prefers a valid stored id, builds the thumbnail from it and reads curation flags strictly', () => {
    const info = videoInfo({ youtube_video_id: 'abcdefghijk', duration_seconds: 867.4, channel_name: ' Khan ', review_scope: 'title_and_channel_only', full_video_reviewed: 'true' }, 'https://youtu.be/zzzzzzzzzzz');
    expect(info).toEqual({
      youtubeId: 'abcdefghijk', thumbnail: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg', durationSeconds: 867, uploadDate: null,
      channel: 'Khan', reviewScope: 'title_and_channel_only', fullReviewed: false, licenseVerified: false,
    });
  });

  it('falls back to the source URL when the stored id is unsafe, and tolerates missing metadata', () => {
    expect(videoInfo({ youtube_video_id: '"><script>' }, 'https://youtu.be/zzzzzzzzzzz').youtubeId).toBe('zzzzzzzzzzz');
    expect(videoInfo(null)).toMatchObject({ youtubeId: null, thumbnail: null, durationSeconds: null, channel: null });
    expect(videoInfo({ duration_seconds: null }).durationSeconds).toBeNull();
  });

  it('shows original channels using publisher metadata without claiming a complete review', () => {
    expect(videoInfo({
      publisher: 'Programador Lhama',
      youtube_video_id: '5JzEyB1AOAg',
      full_video_reviewed: false,
      source_verification: 'channel_video_index',
    })).toMatchObject({
      channel: 'Programador Lhama',
      youtubeId: '5JzEyB1AOAg',
      fullReviewed: false,
      reviewScope: null,
      licenseVerified: false,
    });

    expect(videoInfo({
      channel_name: 'Confirmed Channel',
      publisher: 'Different Publisher',
      review_scope: 'title_and_channel_only',
      full_video_reviewed: false,
    }).channel).toBe('Confirmed Channel');

    expect(videoInfo({ source_creator: 'Estranha História', channel_name: '  ' }).channel).toBe('Estranha História');
    expect(videoInfo({ publisher_channel: 'Aline Elias' }).channel).toBe('Aline Elias');
  });

  it('formats durations for display and for <time dateTime>', () => {
    expect(formatDuration(867)).toBe('14:27');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(3723)).toBe('1:02:03');
    expect(isoDuration(867)).toBe('PT0H14M27S');
  });
});

describe('upload date', () => {
  it('reads the YouTube publication day from the curation metadata', () => {
    expect(videoInfo({ youtube_video_id: 'abcdefghijk', published_date_on_youtube: '2024-06-15' }).uploadDate).toBe('2024-06-15');
    expect(videoInfo({ youtube_video_id: 'abcdefghijk', youtube_published_at: '2012-07-05T10:00:00Z' }).uploadDate).toBe('2012-07-05');
    expect(videoInfo({ youtube_video_id: 'abcdefghijk' }).uploadDate).toBeNull();
  });
  it('rejects malformed or impossible days', () => {
    expect(validDay('2024-02-30')).toBeNull();
    expect(validDay('15/06/2024')).toBeNull();
    expect(validDay('2024-06-15')).toBe('2024-06-15');
  });
});
