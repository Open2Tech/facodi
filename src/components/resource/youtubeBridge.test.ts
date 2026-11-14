import { describe, expect, it } from 'vitest';
import { embedUrl, isYouTubeOrigin, readCurrentTime } from './youtubeBridge';

describe('YouTube bridge', () => {
  it('reads the playback position only from infoDelivery payloads', () => {
    expect(readCurrentTime(JSON.stringify({ event: 'infoDelivery', info: { currentTime: 12.5 } }))).toBe(12.5);
    expect(readCurrentTime(JSON.stringify({ event: 'infoDelivery', info: { volume: 100 } }))).toBeNull();
    expect(readCurrentTime(JSON.stringify({ event: 'infoDelivery', info: { currentTime: -1 } }))).toBeNull();
    expect(readCurrentTime({ info: { currentTime: 3 } })).toBeNull();
    expect(readCurrentTime('not json')).toBeNull();
  });

  it('accepts messages only from YouTube origins', () => {
    expect(isYouTubeOrigin('https://www.youtube-nocookie.com')).toBe(true);
    expect(isYouTubeOrigin('https://evil.example')).toBe(false);
  });

  it('builds the privacy-enhanced embed with the JS API and optional start', () => {
    expect(embedUrl('abc', 'https://app.test', 90)).toBe('https://www.youtube-nocookie.com/embed/abc?autoplay=1&rel=0&enablejsapi=1&origin=https%3A%2F%2Fapp.test&start=90');
    expect(embedUrl('abc', 'https://app.test', null)).not.toContain('start=');
  });
});
