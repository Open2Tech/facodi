import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { parseYoutubeDuration, prepareYoutubePatch, youtubeDataApiFields } from './youtube-data-api-utils.mjs';

describe('YouTube API metadata enrichment', () => {
  it('parses ISO-8601 duration without inventing unknown times', () => {
    assert.equal(parseYoutubeDuration('PT15M33S'), 933);
    assert.equal(parseYoutubeDuration('PT2H3M'), 7380);
    assert.equal(parseYoutubeDuration('P1DT1H4M'), 90240);
    assert.equal(parseYoutubeDuration('PT0S'), null);
    assert.equal(parseYoutubeDuration('bad'), null);
  });
  it('keeps license and embed permission explicitly separate', () => {
    const checkedAt = '2026-11-15T23:00:00Z';
    const parsed = youtubeDataApiFields({
      id: 'dQw4w9WgXcQ',
      snippet: { description: 'Description from creator', publishedAt: '2020-01-01T00:00:00Z' },
      contentDetails: { duration: 'PT3M10S' },
      status: { license: 'youtube', embeddable: false, privacyStatus: 'public' },
    }, checkedAt);
    const result = prepareYoutubePatch({
      metadata: { facodi_review_scope: 'title_and_channel_only' },
      description: null, duration_seconds: null, published_at: null,
    }, parsed);
    assert.equal(result.duration_seconds, 190);
    assert.equal(result.description, 'Description from creator');
    assert.equal(result.metadata.youtube_data_api_v3.embeddable_setting, false);
    assert.equal(result.metadata.youtube_data_api_v3.individual_video_license, 'youtube');
    assert.equal(result.metadata.youtube_data_api_v3.rights_to_rehost, 'not_assumed');
    assert.equal(result.metadata.facodi_review_scope, 'title_and_channel_only');
    assert.ok(!('status' in result));
  });
  it('never overwrites a description, duration or a known language', () => {
    const data = youtubeDataApiFields({
      id: 'dQw4w9WgXcQ',
      snippet: { description: 'New description', defaultAudioLanguage: 'en' },
      contentDetails: { duration: 'PT20M' },
      status: { license: 'creativeCommon', embeddable: true },
    }, '2026-11-15T23:00:00Z');
    const result = prepareYoutubePatch({
      metadata: {}, duration_seconds: 100, description: 'Existing description', language: 'pt',
    }, data);
    assert.equal(result.duration_seconds, undefined);
    assert.equal(result.description, undefined);
    assert.equal(result.language, undefined);
    assert.equal(result.metadata.youtube_data_api_v3.individual_video_license, 'creativeCommon');
  });
});
