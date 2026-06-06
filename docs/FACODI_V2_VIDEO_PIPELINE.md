# FACODI V2 Video Pipeline

FACODI domain data is `facodi`-first. Catalog, public videos, channel pipeline, classifications,
review, and user video submission must read from public `facodi` views and write through V2 Edge
Functions.

Supabase Auth and `public.profiles` remain the temporary identity and role source. Historical
`public` domain tables and legacy Edge Functions may still exist for rollback or audit, but FACODI
runtime code must not call them.

## Public Read Models

Frontend catalog and video reads use:

- `facodi.v_catalog_courses`
- `facodi.v_catalog_units`
- `facodi.v_catalog_playlists`
- `facodi.v_public_videos`
- `facodi.v_playlist_videos`
- `facodi.v_admin_video_classifications` for editor/admin review surfaces

These views are expected to use `security_invoker=true`, so RLS policies on the underlying `facodi`
tables still apply.

## Public Discovery UX

The public `/videos` page is the main discovery surface for FACODI video content. It reads from the
same `facodi` public views and must remain usable without authentication.

Current UX contract:

- URL-persisted filters: `q`, `playlist`, `category`, `language`, and `duration`.
- Search over title, description, channel name, and YouTube id.
- Playlist/trail filtering through `v_catalog_playlists` and `v_playlist_videos`.
- Language and duration filters derived from public video metadata.
- Suggested tag chips derived from the current public video snapshot until taxonomy-backed tags are
   available.
- Discovery rails for featured, recent, quick lessons, course groups, and all results.

Reference screenshots live in `docs/screenshots/` and are linked from the project README.

## Mutation Contract

New FACODI video and pipeline mutations use only V2 Edge Function slugs:

- `v2_fetch_youtube_channel`
- `v2_list_channel_videos`
- `v2_submit_youtube_video`
- `v2_get_video_submission_status`
- `v2_ingest_youtube_video`
- `v2_fetch_youtube_metadata`
- `v2_extract_video_content`
- `v2_generate_embeddings`
- `v2_match_video_candidates`
- `v2_classify_video`
- `v2_review_classification`

## YouTube Integration

FACODI uses public YouTube sources for the first deterministic curation flow. Do not configure or
depend on YouTube API keys, YouTube OAuth credentials, or FACODI webhook secrets for runtime
behaviour.

Runtime sources:

- public channel pages such as `https://www.youtube.com/@Matemateca`
- public `/videos` pages to preserve the visual order shown by YouTube
- public Atom feeds at `feeds/videos.xml?channel_id=...`
- public watch-page metadata and oEmbed for individual videos

If YouTube blocks the public page/feed, backend functions return actionable errors such as
`youtube_public_blocked` or `youtube_channel_videos_not_found`. The UI must not show mock video data
in those cases.

The default pipeline is deterministic-first: metadata, clean text, playlist candidates and
classification. Embeddings and OpenAI/Gemini can remain available for future enrichment, but they do
not block the initial playlist suggestion.

Legacy video/channel slugs such as `fetch_youtube_channel`, `list_channel_videos`,
`analyze_video_batch`, `generate_playlist_suggestions`, `publish_curated_videos`, `enrich-video`,
and `import-youtube-playlist` are not frontend dependencies for FACODI V2. Keep them out of runtime
imports and `supabase.functions.invoke(...)` calls.

## Single Video Submission UX

The user-facing submission flow is:

1. `/videos/submit` validates a YouTube URL or ID and shows a preview.
2. `v2_submit_youtube_video` creates a `facodi.analysis_jobs` row and starts the V2 processing
   chain.
3. `/videos/submit/:jobId` polls `v2_get_video_submission_status`.
4. Failed jobs can be retried by submitting the original URL again.

This mirrors the Open2Tube pattern of simple URL entry, immediate job feedback, status polling, and
retry, but keeps FACODI writes in the `facodi` schema.

## Classification Review

`v2_classify_video` creates revisable deterministic suggestions with
`metadata.decision_source="deterministic"`. Results remain `needs_review` until an editor accepts,
rejects or corrects them.

Editors and admins review classifications via `v2_review_classification`. Remote config must keep:

```toml
[functions.v2_review_classification]
verify_jwt = true
```

## Supabase CLI

Use the project-local CLI:

```bash
pnpm exec supabase --version
pnpm exec supabase functions deploy v2_review_classification --project-ref wvkjainfwsyiyfcmbtid
pnpm exec supabase functions list --project-ref wvkjainfwsyiyfcmbtid
pnpm exec supabase gen types typescript --project-id wvkjainfwsyiyfcmbtid --schema public,facodi > services/supabase.types.ts
```

If the CLI is unavailable, use the Supabase MCP connector for function status, SQL validation, and
type generation checks.

## Validation Checklist

- Runtime code has no `content_submissions`, `video_submissions`, local catalog mock imports,
  `VITE_DATA_SOURCE`, `VITE_CURATOR_MOCK`, or non-V2 video function invocations.
- Removed frontend routes intentionally render 404: `/curator/submit`, `/curator/submissions`,
  `/curator/channel-curation`, and `/admin/conteudos`.
- Public catalog/video counts are populated through `facodi` views.
- Ordinary users can submit and poll only their own video jobs.
- Editor/admin users can review classifications; non-editors cannot.
- Runtime YouTube calls use public HTML, Atom feed and oEmbed only.
