
-- Public, read-only tag facets aligned to the FACODI resource search.
-- No private object, privileged view or bypass of RLS is involved.
CREATE OR REPLACE FUNCTION facodi.list_public_resource_topics_v1(
p_search text DEFAULT '',p_language text DEFAULT NULL,
p_object_type text DEFAULT NULL,p_area text DEFAULT NULL)
RETURNS TABLE(tag text,item_count integer)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path TO 'facodi','pg_temp'
AS $body$
WITH params AS (
 SELECT lower(extensions.unaccent(btrim(left(coalesce(p_search,''),120)))) q,
 websearch_to_tsquery('simple'::regconfig,lower(extensions.unaccent(btrim(left(coalesce(p_search,''),120))))) tsq,
 nullif(lower(btrim(coalesce(p_language,''))),'') lang,
 nullif(btrim(coalesce(p_object_type,'')),'') kind,
 nullif(lower(btrim(coalesce(p_area,''))),'') area
),
matched AS (
 SELECT lo.tags,lower(extensions.unaccent(lo.title)) title_norm,
 lower(extensions.unaccent(coalesce(lo.title,'')||' '||
  array_to_string(coalesce(lo.tags,'{}'::text[]),' '))) area_text
 FROM facodi.learning_objects lo CROSS JOIN params p
 WHERE lo.published AND lo.status IN ('active','published')
 AND nullif(lo.metadata->>'canonical_playlist_slug','') IS NULL
 AND (p.lang IS NULL OR lower(lo.language)=p.lang OR split_part(lower(lo.language),'-',1)=p.lang)
 AND (p.kind IS NULL OR lo.object_type=p.kind)
 AND (p.q='' OR to_tsvector('simple'::regconfig,lower(extensions.unaccent(
   coalesce(lo.title,'')||' '||coalesce(lo.description,'')||' '||
   array_to_string(coalesce(lo.tags,'{}'::text[]),' ')))) @@ p.tsq
   OR lower(extensions.unaccent(lo.title)) LIKE '%'||p.q||'%')
),
area_matched AS (
 SELECT m.tags FROM matched m CROSS JOIN params p
 WHERE p.area IS NULL OR CASE p.area
 WHEN 'mathematics' THEN m.area_text ~ 'matemat|calculo|algebra|estatistic|probabil|trigonometri|geometri'
 WHEN 'technology' THEN m.area_text ~ 'program|software|dados|python|git|linux|sql|excel|web|informat|tecnolog|comput|algorit|react|javascript|cloud'
 WHEN 'science' THEN m.area_text ~ 'fisic|physics|chemistr|quimic|astro|biolog|cienc'
 WHEN 'management' THEN m.area_text ~ 'gestao|gestion|administra|contab|financ|empreend|marketing|negoci|econom'
 WHEN 'languages' THEN m.area_text ~ 'lingu|idiom|ingles|english|literat|teaching|gramatic'
 WHEN 'education' THEN m.area_text ~ 'educa|pedagog|ensino|didatic'
 ELSE FALSE END
),
topics AS (
 SELECT unnest(ARRAY['odoo','odoo-19','erp','recursos-humanos','recrutamento',
 'avaliacao-desempenho','assiduidade','remuneracao','contabilidade','frota',
 'helpdesk','inventario','redes','dev-containers','low-code','python',
 'cloud','react','gestao','tecnologia']) tag
)
SELECT t.tag,count(*)::integer item_count
FROM topics t JOIN area_matched m ON m.tags @> ARRAY[t.tag]::text[]
GROUP BY t.tag HAVING count(*)>0
ORDER BY count(*) DESC,t.tag;
$body$;
REVOKE ALL ON FUNCTION facodi.list_public_resource_topics_v1(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.list_public_resource_topics_v1(text,text,text,text) TO anon,authenticated;

DO $assert$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM facodi.list_public_resource_topics_v1() WHERE tag='odoo' AND item_count>=100)
 OR NOT EXISTS(SELECT 1 FROM facodi.list_public_resource_topics_v1(p_object_type=>'playlist') WHERE tag='odoo')
 THEN RAISE EXCEPTION 'FACODI tag facets not populated';END IF;
END $assert$;
