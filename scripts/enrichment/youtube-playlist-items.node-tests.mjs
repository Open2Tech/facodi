import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isYoutubeVideoId, playlistIdFromUrl, parsePlaylistItemsPage, verifiedPublicVideo, orderedUniqueMembers, planPlaylistMemberImports } from './youtube-playlist-items-utils.mjs';

const listId = 'PLxI8Can9yAHeK7GUEGxMsqoPRmJKwI9Jw';
const id1 = '3yLXNzDUH58';
const id2 = '93sK4jTGrss';
const apiVideo = (id, overrides = {}) => ({
  id, snippet: { title: 'Lecture from author', channelId: 'UCauthor', channelTitle: 'Publisher' },
  status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed' },
  ...overrides,
});

describe('YouTube playlist import safety', () => {
  it('accepts only canonical HTTPS YouTube playlist URLs and 11-character video IDs', () => {
    assert.equal(playlistIdFromUrl('https://www.youtube.com/playlist?list=' + listId), listId);
    assert.equal(playlistIdFromUrl('https://youtube.com/playlist?list=' + listId), listId);
    assert.equal(playlistIdFromUrl('http://www.youtube.com/playlist?list=' + listId), null);
    assert.equal(playlistIdFromUrl('https://evil.youtube.com/playlist?list=' + listId), null);
    assert.equal(playlistIdFromUrl('https://www.youtube.com/watch?v=' + id1), null);
    assert.equal(isYoutubeVideoId(id1), true);
    assert.equal(isYoutubeVideoId('bad'), false);
  });

  it('takes exact membership and zero-based positions from YouTube, ignoring private and wrong-playlist data', () => {
    const page = parsePlaylistItemsPage({ nextPageToken: 'PAGE2', items: [
      { snippet: { playlistId: listId, position: 2, title: 'Episode 3', resourceId: { videoId: id2 } }, contentDetails: { videoId: id2 } },
      { snippet: { playlistId: listId, position: 0, title: 'Episode 1', resourceId: { videoId: id1 } }, contentDetails: { videoId: id1 } },
      { snippet: { playlistId: 'PLother987654', position: 1, title: 'Wrong list', resourceId: { videoId: 'B1r1grQiLdk' } } },
      { snippet: { playlistId: listId, position: 3, title: 'Private video', resourceId: { videoId: 'B1r1grQiLdk' } } },
      { snippet: { playlistId: listId, position: 4, title: 'Mismatch', resourceId: { videoId: id1 } }, contentDetails: { videoId: id2 } },
    ] }, listId);
    assert.deepEqual(page.items.map(x => [x.youtubeId, x.position]), [[id2, 3], [id1, 1]]);
    assert.equal(page.nextPageToken, 'PAGE2');
    assert.throws(() => parsePlaylistItemsPage({ error: 'missing' }, listId));
  });

  it('never imports a second copy of unpublished or orphaned catalogued videos', () => {
    const video = { channelId: 'UCauthor' };
    const members = [
      { youtubeId: id1, playlistChannelId: 'UCauthor', video },
      { youtubeId: id2, playlistChannelId: 'UCauthor', video },
      { youtubeId: 'a1b2c3d4e5f', playlistChannelId: 'UCauthor', video },
      { youtubeId: 'b1c2d3e4f5g', playlistChannelId: 'UCdifferent', video },
    ];
    const approved = new Set([id1]);
    const allCatalogued = new Set([id1, id2]); // id2 is draft or lacks a learning object.
    const plan = planPlaylistMemberImports(members, approved, allCatalogued);
    assert.deepEqual(plan.reusable.map(m => m.youtubeId), [id1]);
    assert.deepEqual(plan.heldForReview.map(m => m.youtubeId), [id2]);
    assert.deepEqual(plan.newCreatorOwned.map(m => m.youtubeId), ['a1b2c3d4e5f']);
    assert.equal(plan.newCreatorOwned.some(m => m.youtubeId === id2), false);
  });

  it('uses only publicly available, embeddable videos with verified channel and deduplicates in original order', () => {
    assert.equal(verifiedPublicVideo(apiVideo(id1, { status: { privacyStatus: 'private', embeddable: true } })), null);
    assert.equal(verifiedPublicVideo(apiVideo(id1, { status: { privacyStatus: 'public', embeddable: false } })), null);
    assert.equal(verifiedPublicVideo(apiVideo(id1, { status: { privacyStatus: 'public' } })), null);
    const videos = [verifiedPublicVideo(apiVideo(id1)), verifiedPublicVideo(apiVideo(id2))].filter(Boolean);
    const members = orderedUniqueMembers([
      { youtubeId: id2, position: 2, videoOwnerChannelId: 'UCauthor' },
      { youtubeId: id1, position: 1, videoOwnerChannelId: 'UCauthor' },
      { youtubeId: id1, position: 3, videoOwnerChannelId: 'UCauthor' },
      { youtubeId: id2, position: 4, videoOwnerChannelId: 'UCanother' },
    ], videos);
    assert.deepEqual(members.map(x => [x.youtubeId, x.position]), [[id1, 1], [id2, 2]]);
    assert.equal(verifiedPublicVideo(apiVideo(id1))?.title, 'Lecture from author');
  });
});
