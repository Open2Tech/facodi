-- Monthly challenge ("desafio do mês"): an anonymous community total of lessons finished in one
-- public editorial sequence during a period. Learners' progress rows stay private (owner-only RLS);
-- this function exposes a single aggregate number and nothing per person.
--
-- * SECURITY DEFINER only to count across learners; it returns one integer.
-- * Small totals (< 10) return NULL, so the number never points at one or two people.
-- * Only published, active playlists; the period is capped at 32 days.
CREATE OR REPLACE FUNCTION facodi.get_public_sequence_community_completions_v1(
  p_slug text, p_from timestamptz, p_to timestamptz)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'facodi','pg_temp'
AS $body$
  WITH playlist AS (
    SELECT lo.id FROM facodi.learning_objects lo
    WHERE lo.slug = p_slug AND lo.object_type = 'playlist'
      AND lo.published AND lo.status IN ('active','published')
  ), total AS (
    SELECT count(*)::integer AS n
    FROM facodi.editorial_playlist_progress p
    JOIN playlist ON playlist.id = p.playlist_id
    WHERE p.completed_at >= p_from AND p.completed_at < p_to
  )
  SELECT CASE WHEN p_to <= p_from OR p_to - p_from > interval '32 days' THEN NULL
              WHEN total.n < 10 THEN NULL
              ELSE total.n END
  FROM total;
$body$;

REVOKE ALL ON FUNCTION facodi.get_public_sequence_community_completions_v1(text,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.get_public_sequence_community_completions_v1(text,timestamptz,timestamptz) TO anon,authenticated;
