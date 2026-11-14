-- Public search over published FACODI objects, never private drafts.
-- Runs with caller permissions and RLS, without SECURITY DEFINER.
CREATE INDEX IF NOT EXISTS facodi_public_learning_search_gin
ON facodi.learning_objects
USING gin(
 to_tsvector('simple'::regconfig,
  coalesce(title,'') || ' ' || coalesce(description,''))
)
WHERE published=true AND status='active';

CREATE OR REPLACE FUNCTION facodi.search_public_catalog_v1(
 p_query text DEFAULT NULL,
 p_types text[] DEFAULT NULL,
 p_limit integer DEFAULT 20,
 p_offset integer DEFAULT 0
)
RETURNS TABLE(
 id uuid,
 object_type text,
 slug text,
 title text,
 summary text,
 source_url text,
 language text,
 relevance real
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = facodi, pg_temp
AS $func$
 WITH params AS(
  SELECT btrim(left(coalesce(p_query,''),120)) search_text,
         websearch_to_tsquery('simple'::regconfig,
           btrim(left(coalesce(p_query,''),120))) search_terms
 )
 SELECT lo.id,lo.object_type,lo.slug,lo.title,lo.description AS summary,
  lo.source_url,lo.language,
  CASE WHEN params.search_text='' THEN 0::real
   ELSE ts_rank(
    to_tsvector('simple'::regconfig,
      coalesce(lo.title,'') || ' ' || coalesce(lo.description,'')),
    params.search_terms) END::real AS relevance
 FROM facodi.learning_objects lo CROSS JOIN params
 WHERE lo.published=true
  AND lo.status='active'
  AND lo.object_type IN ('course','curricular_unit','video','external_resource')
  AND (p_types IS NULL OR lo.object_type=ANY(p_types))
  AND (
   params.search_text=''
   OR to_tsvector('simple'::regconfig,
      coalesce(lo.title,'') || ' ' || coalesce(lo.description,''))
        @@ params.search_terms
   OR lo.title ILIKE '%' || params.search_text || '%'
  )
 ORDER BY relevance DESC,lo.title COLLATE "C",lo.id
 LIMIT least(greatest(coalesce(p_limit,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),1000);
$func$;

REVOKE ALL ON FUNCTION facodi.search_public_catalog_v1(text,text[],integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.search_public_catalog_v1(text,text[],integer,integer)
 TO anon,authenticated;

DO $guard$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
    WHERE published=true AND status='active')<700 THEN
  RAISE EXCEPTION 'Published catalog was unexpectedly reduced'; END IF;
END $guard$;