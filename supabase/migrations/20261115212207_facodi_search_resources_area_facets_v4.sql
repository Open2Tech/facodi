-- FACODI public catalogue thematic filter. Applied to the existing Supabase project
-- as migration 20261115212207 (no Supabase Branch was created).
-- Mirrors v3 public visibility, ranked search, and bounded page-size behaviour.
-- Area patterns are curated discovery hints; keep src/shared/catalog/studyAreas.ts in sync.
CREATE OR REPLACE FUNCTION facodi.search_public_resources_v4(p_search text DEFAULT ''::text, p_language text DEFAULT NULL::text, p_object_type text DEFAULT NULL::text, p_tag text DEFAULT NULL::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 12, p_area text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'facodi', 'pg_temp'
AS $function$
  with params as (
    select q,
      websearch_to_tsquery('simple'::regconfig, q) tsq,
      replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') q_like,
      nullif(btrim(lower(coalesce(p_language, ''))), '') lang,
      nullif(btrim(coalesce(p_object_type, '')), '') kind,
      nullif(btrim(coalesce(p_tag, '')), '') tag,
      nullif(btrim(lower(coalesce(p_area, ''))), '') area,
      least(greatest(coalesce(p_page_size, 12), 1), 50) size,
      least(greatest(coalesce(p_page, 1), 1), 1000) page
    from (select lower(extensions.unaccent(btrim(left(coalesce(p_search, ''), 120)))) q) s
  ),
  docs as (
    select lo.id, lo.slug, lo.title, lo.description, lo.object_type, lo.language,
      lo.tags, lo.metadata, lo.source_url,
      lower(extensions.unaccent(coalesce(lo.title, '') || ' ' ||
        array_to_string(coalesce(lo.tags, '{}'::text[]), ' '))) area_text,
      lower(extensions.unaccent(coalesce(lo.title, ''))) title_norm,
      to_tsvector('simple'::regconfig, lower(extensions.unaccent(
        coalesce(lo.title, '') || ' ' || coalesce(lo.description, '') || ' ' ||
        array_to_string(coalesce(lo.tags, '{}'::text[]), ' ')))) vec
    from facodi.learning_objects lo, params p
    where lo.published and lo.status in ('active', 'published')
      and (p.lang is null or lower(lo.language) = p.lang or split_part(lower(lo.language), '-', 1) = p.lang)
      and (p.tag is null or lo.tags @> array[p.tag]::text[])
  ),
  matches as (
    select d.*,
      case when p.q = '' then 0::real else (ts_rank(d.vec, p.tsq)
        + case when d.title_norm = p.q then 3 when d.title_norm like p.q_like || '%' then 2
               when d.title_norm like '%' || p.q_like || '%' then 1 else 0 end)::real end relevance
    from docs d, params p
    where p.q = '' or d.vec @@ p.tsq or d.title_norm like '%' || p.q_like || '%'
  ),
  area_matches as (
    select m.* from matches m, params p
    where p.area is null or case p.area
      when 'mathematics' then m.area_text ~ 'matemat|calculo|algebra|estatistic|probabil|trigonometri|geometri'
      when 'technology' then m.area_text ~ 'program|software|dados|python|git|linux|sql|excel|web|informat|tecnolog|comput|algorit|react|javascript|cloud'
      when 'science' then m.area_text ~ 'fisic|physics|chemistr|quimic|astro|biolog|cienc'
      when 'management' then m.area_text ~ 'gestao|gestion|administra|contab|financ|empreend|marketing|negoci|econom'
      when 'languages' then m.area_text ~ 'lingu|idiom|ingles|english|literat|teaching|gramatic'
      when 'education' then m.area_text ~ 'educa|pedagog|ensino|didatic'
      else false end
  ),
  results as (
    select m.* from area_matches m, params p where p.kind is null or m.object_type = p.kind
  ),
  paged as (
    select r.* from results r
    order by r.relevance desc, r.title, r.id
    limit (select size from params) offset (select (page - 1) * size from params)
  )
  select jsonb_build_object(
    'total', (select count(*) from results),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.id, 'slug', x.slug, 'title', x.title, 'description', x.description,
        'object_type', x.object_type, 'language', x.language, 'tags', x.tags,
        'metadata', x.metadata, 'source_url', x.source_url)
        order by x.relevance desc, x.title, x.id) from paged x), '[]'::jsonb),
    'types', coalesce((select jsonb_agg(jsonb_build_object('value', t.object_type, 'count', t.n)
        order by t.n desc, t.object_type)
        from (select object_type, count(*) n from area_matches group by object_type) t), '[]'::jsonb)
  );
$function$;

revoke all on function facodi.search_public_resources_v4(text,text,text,text,integer,integer,text) from public;
grant execute on function facodi.search_public_resources_v4(text,text,text,text,integer,integer,text) to anon, authenticated;
