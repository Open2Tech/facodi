/**
 * Parsers for verified YouTube Data API v3 video resources.
 * Data derived from YouTube is kept separate from FACODI curation metadata.
 */
export function parseYoutubeDuration(value) {
  if (typeof value !== 'string') return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!match || !match.slice(1).some(Boolean)) return null;
  const seconds = Number(match[1] || 0) * 86400
    + Number(match[2] || 0) * 3600
    + Number(match[3] || 0) * 60
    + Number(match[4] || 0);
  return Number.isFinite(seconds) && seconds > 0 && seconds <= 7 * 86400
    ? Math.round(seconds) : null;
}

export function youtubeDataApiFields(resource, checkedAt) {
  if (!resource || typeof resource.id !== 'string') return null;
  const snippet = resource.snippet && typeof resource.snippet === 'object' ? resource.snippet : {};
  const status = resource.status && typeof resource.status === 'object' ? resource.status : {};
  const content = resource.contentDetails && typeof resource.contentDetails === 'object'
    ? resource.contentDetails : {};
  const license = ['youtube', 'creativeCommon'].includes(status.license) ? status.license : null;
  const videoStatus = ['public', 'unlisted', 'private'].includes(status.privacyStatus)
    ? status.privacyStatus : null;
  const defaultLanguage = typeof snippet.defaultAudioLanguage === 'string'
    ? snippet.defaultAudioLanguage
    : typeof snippet.defaultLanguage === 'string' ? snippet.defaultLanguage : null;
  const date = typeof snippet.publishedAt === 'string' && Number.isFinite(Date.parse(snippet.publishedAt))
    ? new Date(snippet.publishedAt).toISOString() : null;
  const safeText = (v, max = 10000) => typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;
  return {
    officialDescription: safeText(snippet.description, 5000),
    durationSeconds: parseYoutubeDuration(content.duration),
    publishedAt: date,
    channelId: safeText(snippet.channelId, 100),
    channelTitle: safeText(snippet.channelTitle, 200),
    language: safeText(defaultLanguage, 15),
    checkedAt,
    license,
    embeddable: typeof status.embeddable === 'boolean' ? status.embeddable : null,
    privacyStatus: videoStatus,
    uploadStatus: typeof status.uploadStatus === 'string' ? status.uploadStatus : null,
    title: safeText(snippet.title, 2000),
  };
}

export function prepareYoutubePatch(previous, fields) {
  if (!fields) return null;
  const metadata = {
    ...(previous.metadata || {}),
    youtube_data_api_v3: {
      checked_at: fields.checkedAt,
      source: 'youtube_data_api_v3_videos_list',
      individual_video_license: fields.license,
      embeddable_setting: fields.embeddable,
      privacy_status: fields.privacyStatus,
      upload_status: fields.uploadStatus,
      actual_embed_playback_verified: false,
      audiovisual_content_copied: false,
      rights_to_rehost: 'not_assumed',
      cache_refresh_due_at: new Date(Date.parse(fields.checkedAt) + 25 * 86400000).toISOString(),
    },
  };
  const patch = { metadata };
  // Metadata from the publisher may be refreshed; never rewrite editorial titles,
  // curated tags, video status, approvals, or a learner's progress.
  if (fields.officialDescription && !previous.description) patch.description = fields.officialDescription;
  if (fields.durationSeconds != null && previous.duration_seconds == null) {
    patch.duration_seconds = fields.durationSeconds;
  }
  if (fields.publishedAt && previous.published_at == null) patch.published_at = fields.publishedAt;
  if (fields.channelId && !previous.channel_id) patch.channel_id = fields.channelId;
  if (fields.channelTitle && !previous.channel_title) patch.channel_title = fields.channelTitle;
  if (fields.language && (!previous.language || previous.language === 'und')) patch.language = fields.language;
  return patch;
}
