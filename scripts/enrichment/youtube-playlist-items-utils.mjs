/**
 * Conservative parser for YouTube Data API v3 playlistItems.list / videos.list.
 * Nothing here downloads audiovisual content or asserts redistribution rights.
 */
export const isYoutubeVideoId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);

export function playlistIdFromUrl(sourceUrl) {
  if (typeof sourceUrl !== 'string') return null;
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(url.hostname)
      || url.pathname !== '/playlist') return null;
    const id = url.searchParams.get('list');
    return id && /^[A-Za-z0-9_-]{10,100}$/.test(id) ? id : null;
  } catch { return null; }
}

export function parsePlaylistItemsPage(response, playlistId) {
  if (!response || !Array.isArray(response.items)) throw new Error('Invalid playlistItems API response');
  const items = [];
  for (const item of response.items) {
    const snippet = item?.snippet;
    const details = item?.contentDetails;
    const id = details?.videoId ?? snippet?.resourceId?.videoId;
    if (snippet?.playlistId !== playlistId || !isYoutubeVideoId(id)) continue;
    if (snippet?.resourceId?.videoId && snippet.resourceId.videoId !== id) continue;
    if (!Number.isInteger(snippet?.position) || snippet.position < 0) continue;
    const title = typeof snippet?.title === 'string' ? snippet.title.trim() : '';
    if (!title || /^(private video|deleted video)$/i.test(title)) continue;
    if (item?.status?.privacyStatus === 'private') continue;
    items.push({
      youtubeId: id,
      position: snippet.position + 1,
      title,
      playlistChannelId: snippet.channelId || null,
      videoOwnerChannelId: snippet.videoOwnerChannelId || null,
    });
  }
  return {
    items,
    nextPageToken: typeof response.nextPageToken === 'string' && response.nextPageToken
      ? response.nextPageToken : null,
  };
}

export function verifiedPublicVideo(resource) {
  if (!isYoutubeVideoId(resource?.id)) return null;
  const snippet = resource.snippet ?? {};
  const status = resource.status ?? {};
  if (status.privacyStatus !== 'public' || status.embeddable === false
    || (status.uploadStatus && status.uploadStatus !== 'processed')) return null;
  const title = typeof snippet.title === 'string' ? snippet.title.trim() : '';
  if (!title || /^(private video|deleted video)$/i.test(title)
    || typeof snippet.channelId !== 'string' || !snippet.channelId) return null;
  const language = snippet.defaultAudioLanguage || snippet.defaultLanguage || 'und';
  return {
    youtubeId: resource.id,
    title: title.slice(0, 500),
    channelId: snippet.channelId,
    channelTitle: typeof snippet.channelTitle === 'string' ? snippet.channelTitle.slice(0, 200) : null,
    language: typeof language === 'string' ? language.slice(0, 15) : 'und',
    publishedAt: typeof snippet.publishedAt === 'string' && !Number.isNaN(Date.parse(snippet.publishedAt))
      ? new Date(snippet.publishedAt).toISOString() : null,
    thumbnails: snippet.thumbnails && typeof snippet.thumbnails === 'object' ? snippet.thumbnails : {},
    duration: typeof resource.contentDetails?.duration === 'string'
      ? resource.contentDetails.duration : null,
  };
}

export function orderedUniqueMembers(items, availableVideos) {
  const known = new Map(availableVideos.map(v => [v.youtubeId, v]));
  const seen = new Set();
  return [...items].sort((a, b) => a.position - b.position).flatMap(member => {
    const video = known.get(member.youtubeId);
    if (!video || seen.has(member.youtubeId)) return [];
    // Do not attribute third-party uploads to the playlist owner.
    if (member.videoOwnerChannelId && member.videoOwnerChannelId !== video.channelId) return [];
    seen.add(member.youtubeId);
    return [{ ...member, video }];
  });
}
