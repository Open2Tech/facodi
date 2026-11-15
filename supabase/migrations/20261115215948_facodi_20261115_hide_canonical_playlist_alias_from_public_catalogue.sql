
-- Hide a merged canonical playlist alias from faceted catalogue search.
-- The historical object stays public to preserve incoming bookmarked links.
DO $guard$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects pl
WHERE pl.object_type='playlist' AND pl.published AND pl.status='active'
AND nullif(pl.metadata->>'canonical_playlist_slug','') IS NOT NULL)<>1
OR NOT EXISTS(SELECT 1 FROM facodi.learning_objects pl JOIN facodi.learning_objects canon
ON canon.slug=pl.metadata->>'canonical_playlist_slug'
WHERE pl.slug='facodi-astro-sequence-astro-luz-ondas-observacao'
AND canon.slug='facodi-science-fisica-ondas-optica-moderna'
AND canon.published AND canon.status='active')
THEN RAISE EXCEPTION 'Expected one active canonical alias; abort search change'; END IF;
END $guard$;

DO $update_rpc$ DECLARE fn text; original text; replacement text; BEGIN
SELECT pg_get_functiondef('facodi.search_public_resources_v4(text,text,text,text,integer,integer,text)'::regprocedure) INTO fn;
original := $a$where lo.published and lo.status in ('active', 'published')$a$;
replacement := $b$where lo.published and lo.status in ('active', 'published')
      and nullif(lo.metadata->>'canonical_playlist_slug','') is null$b$;
IF position(original IN fn)=0 THEN RAISE EXCEPTION 'Catalogue search changed upstream; verify before filtering aliases';END IF;
EXECUTE replace(fn,original,replacement);
END $update_rpc$;

DO $verify$ BEGIN
IF EXISTS(
 SELECT 1 FROM jsonb_array_elements((facodi.search_public_resources_v4(
 p_search=>'Astronomia — luz, ondas e observação',p_object_type=>'playlist',p_page_size=>50))->'items') row
 WHERE row->>'slug'='facodi-astro-sequence-astro-luz-ondas-observacao')
OR NOT EXISTS(SELECT 1 FROM facodi.get_public_editorial_playlist_v2(
 'facodi-astro-sequence-astro-luz-ondas-observacao')
 WHERE playlist_slug='facodi-science-fisica-ondas-optica-moderna' AND item_count=4)
THEN RAISE EXCEPTION 'Alias still visible in catalogue or legacy redirect broken';END IF;
END $verify$;
