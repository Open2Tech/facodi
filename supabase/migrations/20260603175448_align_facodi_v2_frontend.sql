-- Align FACODI frontend with the facodi v2 schema.
-- Non-destructive: public legacy tables remain untouched and are used only as a backfill source.

CREATE OR REPLACE FUNCTION facodi.slugify_text(value TEXT, fallback TEXT DEFAULT 'item')
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      regexp_replace(
        regexp_replace(lower(coalesce(value, fallback)), '[^a-z0-9]+', '-', 'g'),
        '(^-|-$)',
        '',
        'g'
      ),
      ''
    ),
    fallback
  );
$$;

INSERT INTO facodi.courses (
  id,
  external_source,
  external_id,
  odoo_channel_id,
  slug,
  title,
  normalized_title,
  summary,
  description_html,
  degree_type,
  language,
  school,
  source_url,
  plan_url,
  status,
  published,
  metadata,
  synced_at,
  created_at,
  updated_at
)
SELECT
  c.id,
  'public_legacy',
  coalesce(c.odoo_id::text, c.code, c.id::text),
  c.odoo_id,
  facodi.slugify_text(c.code, c.id::text),
  c.title,
  lower(c.title),
  c.description,
  c.long_description,
  c.degree_type,
  c.language_code,
  c.school,
  c.website_url,
  c.website_url,
  CASE WHEN c.is_active THEN 'active' ELSE 'archived' END,
  c.is_active,
  jsonb_strip_nulls(
    coalesce(c.metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'legacy_schema', 'public',
      'legacy_table', 'courses',
      'legacy_id', c.id,
      'legacy_code', c.code,
      'institution', c.institution,
      'ects_total', c.ects_total,
      'duration_semesters', c.duration_semesters,
      'curriculum_version', c.curriculum_version,
      'content_license', c.content_license,
      'enroll', c.enroll,
      'members_count', c.members_count
    )
  ),
  now(),
  c.created_at,
  c.updated_at
FROM public.courses c
ON CONFLICT (id) DO UPDATE SET
  external_id = EXCLUDED.external_id,
  odoo_channel_id = EXCLUDED.odoo_channel_id,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  normalized_title = EXCLUDED.normalized_title,
  summary = EXCLUDED.summary,
  description_html = EXCLUDED.description_html,
  degree_type = EXCLUDED.degree_type,
  language = EXCLUDED.language,
  school = EXCLUDED.school,
  source_url = EXCLUDED.source_url,
  plan_url = EXCLUDED.plan_url,
  status = EXCLUDED.status,
  published = EXCLUDED.published,
  metadata = EXCLUDED.metadata,
  synced_at = EXCLUDED.synced_at,
  updated_at = now();

INSERT INTO facodi.curricular_units (
  id,
  course_id,
  external_source,
  external_id,
  odoo_slide_id,
  code,
  slug,
  title,
  normalized_title,
  summary,
  description_html,
  curricular_year,
  semester,
  ects,
  language,
  official_pdf_url,
  status,
  metadata,
  synced_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.course_id,
  'public_legacy',
  coalesce(u.odoo_id::text, u.code, u.id::text),
  u.odoo_id,
  u.code,
  facodi.slugify_text(coalesce(u.code, u.name), u.id::text),
  u.name,
  lower(u.name),
  u.summary,
  u.content,
  u.year,
  CASE
    WHEN u.semester BETWEEN 1 AND 3 THEN u.semester
    WHEN u.semester IS NOT NULL THEN ((u.semester - 1) % 2) + 1
    ELSE NULL
  END,
  u.ects,
  coalesce((u.metadata ->> 'language'), 'pt'),
  coalesce(u.syllabus_url, u.content_url),
  coalesce(nullif(u.editorial_state, ''), 'active'),
  jsonb_strip_nulls(
    coalesce(u.metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'legacy_schema', 'public',
      'legacy_table', 'units',
      'legacy_id', u.id,
      'legacy_code', u.code,
      'unit_code', coalesce(u.unit_code, u.code),
      'section_name', u.section_name,
      'category', u.category,
      'difficulty', u.difficulty,
      'duration', u.duration,
      'legacy_semester', u.semester,
      'contributor', u.contributor,
      'tags', to_jsonb(u.tags),
      'prerequisites', to_jsonb(u.prerequisites),
      'content_url', u.content_url,
      'website_url', u.website_url,
      'video_url', u.video_url,
      'source_url', u.source_url,
      'position', u.position,
      'slide_category', u.slide_category
    )
  ),
  now(),
  u.created_at,
  u.updated_at
FROM public.units u
JOIN facodi.courses c ON c.id = u.course_id
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  external_id = EXCLUDED.external_id,
  odoo_slide_id = EXCLUDED.odoo_slide_id,
  code = EXCLUDED.code,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  normalized_title = EXCLUDED.normalized_title,
  summary = EXCLUDED.summary,
  description_html = EXCLUDED.description_html,
  curricular_year = EXCLUDED.curricular_year,
  semester = EXCLUDED.semester,
  ects = EXCLUDED.ects,
  language = EXCLUDED.language,
  official_pdf_url = EXCLUDED.official_pdf_url,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  synced_at = EXCLUDED.synced_at,
  updated_at = now();

INSERT INTO facodi.youtube_videos (
  id,
  youtube_video_id,
  canonical_url,
  title,
  description,
  channel_title,
  duration_seconds,
  thumbnails,
  language,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  v.id,
  v.youtube_id,
  'https://www.youtube.com/watch?v=' || v.youtube_id,
  v.title,
  v.description,
  v.channel_name,
  v.duration_seconds,
  jsonb_strip_nulls(jsonb_build_object('default', v.thumbnail_url, 'high', v.thumbnail_url)),
  v.language,
  'classified',
  jsonb_build_object(
    'legacy_schema', 'public',
    'legacy_table', 'videos',
    'legacy_id', v.id,
    'category_id', v.category_id,
    'submitted_by', v.submitted_by,
    'view_count', v.view_count,
    'is_featured', v.is_featured,
    'favorites_count', v.favorites_count,
    'playlist_add_count', v.playlist_add_count
  ),
  v.created_at,
  v.updated_at
FROM public.videos v
ON CONFLICT (youtube_video_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  channel_title = EXCLUDED.channel_title,
  duration_seconds = EXCLUDED.duration_seconds,
  thumbnails = EXCLUDED.thumbnails,
  language = EXCLUDED.language,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now();

WITH mapped AS (
  SELECT DISTINCT ON (yv.id, cu.id)
    yv.id AS video_id,
    cu.course_id,
    cu.id AS curricular_unit_id,
    jsonb_build_array(
      jsonb_build_object(
        'source', 'public_playlist_videos',
        'playlist_id', p.id,
        'playlist_name', p.name,
        'playlist_slug', p.slug,
        'position', pv.position
      )
    ) AS evidence
  FROM public.playlist_videos pv
  JOIN public.playlists p ON p.id = pv.playlist_id
  JOIN public.videos v ON v.id = pv.video_id
  JOIN facodi.youtube_videos yv ON yv.youtube_video_id = v.youtube_id
  JOIN facodi.courses c
    ON c.published IS TRUE
   AND c.status = 'active'
   AND (
     c.metadata ->> 'legacy_code' = p.course_code
     OR c.slug = facodi.slugify_text(p.course_code, p.course_code)
     OR c.id::text = p.course_code
   )
  JOIN facodi.curricular_units cu
    ON cu.course_id = c.id
   AND cu.status = 'active'
   AND (
     cu.code = p.unit_code
     OR cu.metadata ->> 'unit_code' = p.unit_code
     OR cu.metadata ->> 'legacy_code' = p.unit_code
     OR cu.id::text = p.unit_code
   )
  WHERE p.is_public IS TRUE
    AND p.unit_code IS NOT NULL
)
INSERT INTO facodi.video_classifications (
  video_id,
  course_id,
  curricular_unit_id,
  confidence,
  confidence_level,
  status,
  needs_review,
  justification,
  evidence,
  metadata,
  reviewed_at,
  created_at,
  updated_at
)
SELECT
  mapped.video_id,
  mapped.course_id,
  mapped.curricular_unit_id,
  1,
  'high',
  'accepted',
  false,
  'Backfilled from existing public playlist-to-unit assignment.',
  mapped.evidence,
  jsonb_build_object('legacy_backfill', true, 'source', 'public_playlist_videos'),
  now(),
  now(),
  now()
FROM mapped
WHERE NOT EXISTS (
  SELECT 1
  FROM facodi.video_classifications existing
  WHERE existing.video_id = mapped.video_id
    AND existing.course_id = mapped.course_id
    AND existing.curricular_unit_id = mapped.curricular_unit_id
    AND existing.status IN ('accepted', 'corrected')
);

CREATE OR REPLACE VIEW facodi.v_catalog_courses
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.metadata ->> 'legacy_code' AS code,
  c.slug,
  c.title,
  coalesce(c.summary, c.title) AS description,
  coalesce((c.metadata ->> 'ects_total')::numeric, 0) AS ects,
  coalesce((c.metadata ->> 'duration_semesters')::integer, 6) AS semesters,
  coalesce(c.metadata ->> 'institution', 'FACODI') AS institution,
  c.school,
  c.degree_type,
  c.language,
  coalesce(c.description_html, c.summary, c.title) AS long_description,
  c.source_url AS website_url,
  c.metadata ->> 'curriculum_version' AS curriculum_version,
  c.metadata ->> 'content_license' AS content_license,
  c.status,
  c.published,
  c.metadata,
  c.updated_at
FROM facodi.courses c
WHERE c.published IS TRUE
  AND c.status = 'active';

CREATE OR REPLACE VIEW facodi.v_catalog_units
WITH (security_invoker = true)
AS
SELECT
  cu.id,
  cu.course_id,
  c.metadata ->> 'legacy_code' AS course_code,
  cu.code,
  cu.slug,
  cu.title AS name,
  coalesce(cu.summary, cu.description_html, '') AS summary,
  cu.description_html AS content,
  cu.metadata ->> 'content_url' AS content_url,
  cu.official_pdf_url AS syllabus_url,
  coalesce(cu.ects, 0) AS ects,
  coalesce(cu.semester, 1) AS semester,
  coalesce(cu.curricular_year, 1) AS year,
  cu.metadata ->> 'category' AS category,
  cu.metadata ->> 'difficulty' AS difficulty,
  coalesce(cu.metadata ->> 'duration', 'N/A') AS duration,
  coalesce(cu.metadata ->> 'contributor', 'FACODI') AS contributor,
  coalesce(
    ARRAY(SELECT jsonb_array_elements_text(cu.metadata -> 'tags')),
    '{}'::text[]
  ) AS tags,
  coalesce(
    ARRAY(SELECT jsonb_array_elements_text(cu.metadata -> 'prerequisites')),
    '{}'::text[]
  ) AS prerequisites,
  coalesce(cu.metadata ->> 'unit_code', cu.code) AS unit_code,
  cu.metadata ->> 'section_name' AS section_name,
  cu.metadata ->> 'website_url' AS website_url,
  cu.metadata ->> 'video_url' AS video_url,
  cu.metadata ->> 'source_url' AS source_url,
  coalesce((cu.metadata ->> 'position')::integer, 0) AS position,
  cu.status,
  cu.metadata,
  cu.updated_at
FROM facodi.curricular_units cu
JOIN facodi.courses c ON c.id = cu.course_id
WHERE cu.status = 'active'
  AND c.published IS TRUE
  AND c.status = 'active';

CREATE OR REPLACE VIEW facodi.v_catalog_playlists
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name AS title,
  p.slug,
  coalesce(p.description, '') AS description,
  cu.course_id,
  c.metadata ->> 'legacy_code' AS course_code,
  cu.id AS unit_id,
  coalesce(cu.metadata ->> 'unit_code', cu.code) AS unit_code,
  coalesce(p.video_count, 0) AS video_count,
  p.total_duration_seconds,
  p.is_public,
  p.updated_at
FROM public.playlists p
JOIN facodi.courses c
  ON c.published IS TRUE
 AND c.status = 'active'
 AND (
   c.metadata ->> 'legacy_code' = p.course_code
   OR c.slug = facodi.slugify_text(p.course_code, p.course_code)
   OR c.id::text = p.course_code
 )
JOIN facodi.curricular_units cu
  ON cu.course_id = c.id
 AND cu.status = 'active'
 AND (
   cu.code = p.unit_code
   OR cu.metadata ->> 'unit_code' = p.unit_code
   OR cu.metadata ->> 'legacy_code' = p.unit_code
   OR cu.id::text = p.unit_code
 )
WHERE p.is_public IS TRUE
  AND p.unit_code IS NOT NULL;

CREATE OR REPLACE VIEW facodi.v_public_videos
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (yv.id)
  yv.id,
  yv.youtube_video_id AS youtube_id,
  yv.title,
  coalesce(yv.description, '') AS description,
  coalesce(yv.channel_title, '') AS channel_name,
  yv.duration_seconds,
  coalesce(yv.thumbnails ->> 'high', yv.thumbnails ->> 'default', '') AS thumbnail_url,
  coalesce(yv.language, 'pt') AS language,
  vc.id AS classification_id,
  vc.course_id,
  vc.curricular_unit_id AS unit_id,
  vc.confidence,
  vc.status AS classification_status,
  vc.created_at,
  vc.updated_at
FROM facodi.youtube_videos yv
JOIN facodi.video_classifications vc ON vc.video_id = yv.id
LEFT JOIN facodi.courses c ON c.id = vc.course_id
LEFT JOIN facodi.curricular_units cu ON cu.id = vc.curricular_unit_id
WHERE vc.status IN ('accepted', 'corrected')
  AND c.published IS TRUE
  AND c.status = 'active'
  AND (cu.id IS NULL OR cu.status = 'active')
ORDER BY yv.id, vc.confidence DESC, vc.updated_at DESC;

CREATE OR REPLACE VIEW facodi.v_playlist_videos
WITH (security_invoker = true)
AS
SELECT
  p.id AS playlist_id,
  p.name AS playlist_title,
  p.slug AS playlist_slug,
  pv.position,
  yv.id,
  yv.youtube_video_id AS youtube_id,
  yv.title,
  coalesce(yv.description, '') AS description,
  coalesce(yv.channel_title, '') AS channel_name,
  yv.duration_seconds,
  coalesce(yv.thumbnails ->> 'high', yv.thumbnails ->> 'default', '') AS thumbnail_url,
  coalesce(yv.language, 'pt') AS language,
  vc.id AS classification_id,
  vc.course_id,
  vc.curricular_unit_id AS unit_id,
  vc.confidence,
  vc.status AS classification_status,
  pv.created_at,
  coalesce(yv.updated_at, pv.created_at) AS updated_at
FROM public.playlist_videos pv
JOIN public.playlists p ON p.id = pv.playlist_id
JOIN public.videos v ON v.id = pv.video_id
JOIN facodi.youtube_videos yv ON yv.youtube_video_id = v.youtube_id
JOIN facodi.video_classifications vc ON vc.video_id = yv.id
JOIN facodi.courses c ON c.id = vc.course_id
LEFT JOIN facodi.curricular_units cu ON cu.id = vc.curricular_unit_id
WHERE p.is_public IS TRUE
  AND vc.status IN ('accepted', 'corrected')
  AND c.published IS TRUE
  AND c.status = 'active'
  AND (cu.id IS NULL OR cu.status = 'active');

CREATE OR REPLACE VIEW facodi.v_admin_video_classifications
WITH (security_invoker = true)
AS
SELECT
  vc.id,
  vc.video_id,
  yv.youtube_video_id,
  yv.title AS video_title,
  yv.channel_title,
  coalesce(yv.thumbnails ->> 'high', yv.thumbnails ->> 'default', '') AS thumbnail_url,
  vc.course_id,
  c.title AS course_title,
  vc.curricular_unit_id,
  cu.title AS unit_title,
  cu.code AS unit_code,
  vc.confidence,
  vc.confidence_level,
  vc.status,
  vc.needs_review,
  vc.justification,
  vc.evidence,
  vc.metadata,
  vc.reviewed_by,
  vc.reviewed_at,
  vc.created_at,
  vc.updated_at
FROM facodi.video_classifications vc
JOIN facodi.youtube_videos yv ON yv.id = vc.video_id
LEFT JOIN facodi.courses c ON c.id = vc.course_id
LEFT JOIN facodi.curricular_units cu ON cu.id = vc.curricular_unit_id;

DROP POLICY IF EXISTS public_read_classified_videos ON facodi.youtube_videos;
CREATE POLICY public_read_classified_videos ON facodi.youtube_videos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM facodi.video_classifications vc
      JOIN facodi.courses c ON c.id = vc.course_id
      LEFT JOIN facodi.curricular_units cu ON cu.id = vc.curricular_unit_id
      WHERE vc.video_id = youtube_videos.id
        AND vc.status IN ('accepted', 'corrected')
        AND c.published IS TRUE
        AND c.status = 'active'
        AND (cu.id IS NULL OR cu.status = 'active')
    )
  );

DROP POLICY IF EXISTS public_read_accepted_classifications ON facodi.video_classifications;
CREATE POLICY public_read_accepted_classifications ON facodi.video_classifications
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('accepted', 'corrected')
    AND EXISTS (
      SELECT 1
      FROM facodi.courses c
      LEFT JOIN facodi.curricular_units cu ON cu.id = video_classifications.curricular_unit_id
      WHERE c.id = video_classifications.course_id
        AND c.published IS TRUE
        AND c.status = 'active'
        AND (cu.id IS NULL OR cu.status = 'active')
    )
  );

GRANT USAGE ON SCHEMA facodi TO anon, authenticated;
GRANT SELECT ON
  facodi.youtube_videos,
  facodi.video_classifications,
  facodi.v_catalog_courses,
  facodi.v_catalog_units,
  facodi.v_catalog_playlists,
  facodi.v_public_videos,
  facodi.v_playlist_videos
TO anon, authenticated;

GRANT SELECT ON facodi.v_admin_video_classifications TO authenticated;

GRANT EXECUTE ON FUNCTION facodi.slugify_text(TEXT, TEXT) TO anon, authenticated, service_role;
