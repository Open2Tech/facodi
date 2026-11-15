-- Public resource catalogue search, v3.
-- Fixes v2 gaps found on /resources:
--   * covers every public object type (v2 only searched course, unit, video, external);
--   * same visibility as the browse list: published and status active/published;
--   * accent-insensitive matching on title, description and tags ("analise" finds "Análise");
--   * a base language filter includes regional variants ("pt" matches "pt-BR");
--   * returns type counts for the current search/language/tag, so facets are exact
--     instead of a client-side tally capped by the API row limit.
-- v2 stays in place for backwards compatibility.
create or replace function facodi.search_public_resources_v3(
  p_search text default '',
  p_language text default null,
  p_object_type text default null,
  p_tag text default null,
  p_page integer default 1,
  p_page_size integer default 12
)
returns jsonb
language sql
stable
security invoker
set search_path = facodi, pg_temp
as $$
  with params as (
    select q,
      websearch_to_tsquery('simple'::regconfig, q) tsq,
      replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') q_like,
      nullif(btrim(lower(coalesce(p_language, ''))), '') lang,
      nullif(btrim(coalesce(p_object_type, '')), '') kind,
      nullif(btrim(coalesce(p_tag, '')), '') tag,
      least(greatest(coalesce(p_page_size, 12), 1), 50) size,
      least(greatest(coalesce(p_page, 1), 1), 1000) page
    from (select lower(extensions.unaccent(btrim(left(coalesce(p_search, ''), 120)))) q) s
  ),
  docs as (
    select lo.id, lo.slug, lo.title, lo.description, lo.object_type, lo.language,
      lo.tags, lo.metadata, lo.source_url,
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
  results as (
    select m.* from matches m, params p where p.kind is null or m.object_type = p.kind
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
        from (select object_type, count(*) n from matches group by object_type) t), '[]'::jsonb)
  );
$$;

revoke all on function facodi.search_public_resources_v3(text, text, text, text, integer, integer) from public;
grant execute on function facodi.search_public_resources_v3(text, text, text, text, integer, integer) to anon, authenticated;

comment on function facodi.search_public_resources_v3(text, text, text, text, integer, integer) is
  'Public FACODI resource catalogue: accent-insensitive ranked search over every public type, base-language filter including regional variants, and exact type facets. SECURITY INVOKER: catalogue RLS still applies.';
