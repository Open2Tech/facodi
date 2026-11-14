-- FACODI: full-text search with complete pagination and existing UI facets.
-- Invoker permissions + RLS are enforced; never use service-role access.
CREATE OR REPLACE FUNCTION facodi.search_public_resources_v2(
  p_search text DEFAULT '',
  p_language text DEFAULT NULL,
  p_object_type text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=facodi,pg_temp
AS $fn$
 WITH params AS (
   SELECT btrim(left(coalesce(p_search,''),120)) q,
          websearch_to_tsquery('simple'::regconfig,
             btrim(left(coalesce(p_search,''),120))) tsq,
          least(greatest(coalesce(p_page_size,12),1),50) size,
          least(greatest(coalesce(p_page,1),1),1000) page
 ),
 results AS (
  SELECT lo.id,lo.slug,lo.title,lo.description,lo.object_type,
         lo.language,lo.tags,lo.metadata,lo.source_url,
         CASE WHEN p.q='' THEN 0::real
          ELSE ts_rank(
            to_tsvector('simple'::regconfig,coalesce(lo.title,'')||' '||coalesce(lo.description,'')),
            p.tsq)::real END relevance
  FROM facodi.learning_objects lo CROSS JOIN params p
  WHERE lo.published=true AND lo.status='active'
    AND lo.object_type IN ('course','curricular_unit','video','external_resource')
    AND (nullif(p_language,'') IS NULL OR lo.language=p_language)
    AND (nullif(p_object_type,'') IS NULL OR lo.object_type=p_object_type)
    AND (nullif(p_tag,'') IS NULL OR lo.tags @> ARRAY[p_tag]::text[])
    AND (p.q='' OR
        to_tsvector('simple'::regconfig,coalesce(lo.title,'')||' '||coalesce(lo.description,'')) @@ p.tsq
        OR lo.title ILIKE '%'||p.q||'%')
 ),
 counted AS (SELECT count(*) AS n FROM results),
 paged AS (
   SELECT r.* FROM results r
   ORDER BY r.relevance DESC,r.title COLLATE "C",r.id
   LIMIT (SELECT size FROM params)
   OFFSET (SELECT (page-1)*size FROM params)
 )
 SELECT jsonb_build_object(
   'total', (SELECT n FROM counted),
   'items', coalesce((SELECT jsonb_agg(to_jsonb(row) - 'relevance'
     ORDER BY row.relevance DESC,row.title COLLATE "C",row.id)
      FROM paged row),'[]'::jsonb)
 );
$fn$;
REVOKE ALL ON FUNCTION facodi.search_public_resources_v2(text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.search_public_resources_v2(text,text,text,text,integer,integer)
 TO anon,authenticated;
