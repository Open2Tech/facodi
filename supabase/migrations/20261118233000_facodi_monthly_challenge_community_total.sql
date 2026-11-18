-- FACODI monthly challenge public aggregates, fixed campaigns only.
-- SQL function owner must be a trusted DB role. The progress table remains owner-only via RLS.
-- Arbitrary periods, other playlists and totals from fewer than 10 different learners
-- always return NULL, preventing differencing/probing individual progress.
CREATE OR REPLACE FUNCTION facodi.get_public_sequence_community_completions_v1(
  p_slug text, p_from timestamptz, p_to timestamptz
)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, facodi, pg_temp
AS $body$
  WITH permitted_month AS (
    SELECT 1 WHERE
      (p_slug = 'facodi-gestao-sequencia-estatistica-i'
       AND p_from = timestamptz '2026-12-01 00:00:00+00'
       AND p_to = timestamptz '2027-01-01 00:00:00+00')
      OR
      (p_slug = 'facodi-math-otimizacao-economia'
       AND p_from = timestamptz '2027-01-01 00:00:00+00'
       AND p_to = timestamptz '2027-02-01 00:00:00+00')
  ),
  tally AS (
    SELECT count(*)::integer AS lessons,
           count(distinct p.user_id)::integer AS learners
    FROM facodi.editorial_playlist_progress p
    JOIN facodi.learning_objects lo ON lo.id = p.playlist_id
    WHERE EXISTS (SELECT 1 FROM permitted_month)
      AND lo.slug = p_slug
      AND lo.object_type = 'playlist'
      AND lo.published AND lo.status = 'active'
      AND p.completed_at >= p_from AND p.completed_at < p_to
  )
  SELECT CASE WHEN tally.learners >= 10 AND tally.lessons >= 10
              THEN tally.lessons ELSE NULL END
  FROM tally;
$body$;

REVOKE ALL ON FUNCTION facodi.get_public_sequence_community_completions_v1(text,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.get_public_sequence_community_completions_v1(text,timestamptz,timestamptz) TO anon,authenticated;