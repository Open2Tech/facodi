
-- Add useful learning-context metadata without inventing publisher descriptions.
-- AI tag proposals are retained as UNREVIEWED suggestions; no transcript is copied.
CREATE TEMP TABLE _study_enrichment ON COMMIT DROP AS
WITH base AS (
 SELECT
   y.id youtube_row_id,lo.id learning_object_id,
   lo.title,y.channel_title,
   u.units,u.unit_titles,
   seq.sequences,seq.sequence_titles,
   ai.id ai_enrichment_id,
   ai.semantic_tags ai_raw_tags,
   topic.suggested_topics,
   k.keywords,
   lo.description current_description
 FROM facodi.youtube_videos y
 JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.object_type='video'
 LEFT JOIN LATERAL (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
     'course_code',z.course_code,'unit_code',z.unit_code,'unit_title',z.unit_title)
     ORDER BY z.course_code,z.unit_code),'[]'::jsonb) units,
    coalesce(array_agg(z.unit_title ORDER BY z.course_code,z.unit_code),'{}'::text[]) unit_titles
  FROM (
   SELECT DISTINCT c.code course_code,u.code unit_code,u.title unit_title
   FROM facodi.learning_object_relations rel
   JOIN facodi.curricular_units u ON u.learning_object_id=rel.parent_object_id AND u.published
   JOIN facodi.courses c ON c.id=u.course_id AND c.published
   WHERE rel.child_object_id=lo.id AND rel.relation_type='contains'
     AND rel.metadata->>'review_status'='approved'
   ORDER BY c.code,u.code LIMIT 8
  ) z
 ) u ON TRUE
 LEFT JOIN LATERAL (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
       'slug',z.slug,'title',z.title,'position',z.position)
       ORDER BY z.slug,z.position),'[]'::jsonb) sequences,
    coalesce(array_agg(z.title ORDER BY z.slug,z.position),'{}'::text[]) sequence_titles
  FROM (
   SELECT p.slug,p.title,rel.position
   FROM facodi.learning_object_relations rel
   JOIN facodi.learning_objects p ON p.id=rel.parent_object_id
     AND p.object_type='playlist' AND p.published AND p.status='active'
   WHERE rel.child_object_id=lo.id AND rel.relation_type='contains'
     AND rel.metadata->>'review_status'='approved'
     AND rel.metadata->>'review_scope'='title_and_channel_only'
   ORDER BY p.slug,rel.position LIMIT 6
  ) z
 ) seq ON TRUE
 LEFT JOIN LATERAL (
   SELECT a.id,a.semantic_tags FROM public.videos v
   JOIN public.ai_enrichments a ON a.video_id=v.id
   WHERE v.youtube_id=y.youtube_video_id
   ORDER BY coalesce(a.reprocessed_at,a.created_at) DESC,a.id DESC LIMIT 1
 ) ai ON TRUE
 LEFT JOIN LATERAL (
   SELECT coalesce(array_agg(DISTINCT x.normalized ORDER BY x.normalized),'{}'::text[]) suggested_topics
   FROM (
     SELECT CASE lower(extensions.unaccent(btrim(t)))
       WHEN 'matematica' THEN 'matematica'
       WHEN 'calculo' THEN 'calculo'
       WHEN 'estatistica' THEN 'estatistica'
       WHEN 'probabilidade' THEN 'probabilidade'
       WHEN 'programacao' THEN 'programacao'
       WHEN 'python' THEN 'python'
       WHEN 'sql' THEN 'sql'
       WHEN 'sql server' THEN 'sql'
       WHEN 'banco de dados' THEN 'bases-de-dados'
       WHEN 'machine learning' THEN 'aprendizagem-automatica'
       WHEN 'recursos humanos' THEN 'recursos-humanos'
       WHEN 'gestao de pessoas' THEN 'recursos-humanos'
       WHEN 'recrutamento' THEN 'recrutamento'
       WHEN 'odoo' THEN 'odoo'
       WHEN 'erp' THEN 'erp'
       WHEN 'tipografia' THEN 'tipografia'
       WHEN 'design' THEN 'design'
       WHEN 'design grafico' THEN 'design'
       WHEN 'historia da arte' THEN 'historia-da-arte'
       WHEN 'fisica' THEN 'fisica'
       WHEN 'tecnologia' THEN 'tecnologia'
       WHEN 'linux' THEN 'linux'
       WHEN 'integracao' THEN 'integracoes'
       WHEN 'analise de dados' THEN 'analise-de-dados'
       ELSE NULL END normalized
     FROM unnest(coalesce(ai.semantic_tags,'{}'::text[])) t
   ) x WHERE x.normalized IS NOT NULL
 ) topic ON TRUE
 LEFT JOIN LATERAL (
  SELECT coalesce(array_agg(z.value ORDER BY z.first_position),'{}'::text[]) keywords
  FROM (
   SELECT value,min(position)::bigint first_position
   FROM unnest(
      ARRAY[lo.title,y.channel_title]::text[]
      || coalesce(u.unit_titles,'{}'::text[])
      || coalesce(seq.sequence_titles,'{}'::text[])
      || coalesce(topic.suggested_topics,'{}'::text[])
      || coalesce(lo.tags,'{}'::text[])
   ) WITH ORDINALITY term(value,position)
   WHERE nullif(btrim(value),'') IS NOT NULL AND length(value)<=120
     AND lower(value) <> ALL(ARRAY[
     'youtube','recurso-externo','facodi','video','vídeo','apoio-ao-estudo',
     'curadoria-facodi','2026','playlist','recurso complementar',
     'curadoria-editorial','sequencia-editorial'])
   GROUP BY value ORDER BY min(position) LIMIT 12
  ) z
 ) k ON TRUE
)
SELECT * FROM base;

DO $pre$ BEGIN
 IF (SELECT count(*) FROM _study_enrichment)<>940
 OR (SELECT count(*) FROM _study_enrichment WHERE ai_enrichment_id IS NOT NULL)<>579
 OR EXISTS(SELECT 1 FROM _study_enrichment WHERE cardinality(keywords)<2)
 THEN RAISE EXCEPTION 'Video associations/AI provenance unexpectedly changed';END IF;
END $pre$;

UPDATE facodi.learning_objects lo SET
 keywords=CASE WHEN cardinality(lo.keywords)=0 THEN q.keywords ELSE lo.keywords END,
 description=CASE WHEN nullif(btrim(lo.description),'') IS NULL
   THEN 'Referência em vídeo publicada no canal '||q.channel_title||
    ' do YouTube. Recurso complementar da FACODI sobre o tema indicado no título, com fonte original preservada.'
   ELSE lo.description END,
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object(
  'curricular_context_confirmed_by_approved_relations',q.units,
  'editorial_sequence_context_confirmed_by_approved_relations',q.sequences,
  'keyword_derivation','source_title_channel_approved_curriculum_and_proposed_AI_topics',
  'curriculum_links_are_supplementary_not_official_lectures',true,
  'youtube_creator_description_if_missing','not_replaced_by_AI_transcript',
  'educational_metadata_quality_batch','facodi_20261115_education_context_keywords')||
 CASE WHEN cardinality(lo.keywords)=0
   THEN jsonb_build_object('keywords_generated_from_existing_catalogue',true)
   ELSE '{}'::jsonb END||
 CASE WHEN q.ai_enrichment_id IS NOT NULL THEN
   jsonb_build_object('public_ai_enrichment_reference',q.ai_enrichment_id,
      'ai_suggested_topics_unreviewed',to_jsonb(q.suggested_topics),
      'ai_metadata_status','suggested_topics_only_not_verified',
      'ai_transcript_text_copied',false)
   ELSE '{}'::jsonb END
FROM _study_enrichment q WHERE lo.id=q.learning_object_id;

UPDATE facodi.youtube_videos y SET metadata=coalesce(y.metadata,'{}'::jsonb)||
 CASE WHEN q.ai_enrichment_id IS NOT NULL
  THEN jsonb_build_object(
   'public_ai_enrichment_reference',q.ai_enrichment_id,
   'ai_topics_review_status','unreviewed_suggestions',
   'ai_transcript_description_republished',false)
  ELSE '{}'::jsonb END||
 jsonb_build_object(
 'curricular_association_count',jsonb_array_length(q.units),
 'editorial_sequence_association_count',jsonb_array_length(q.sequences),
 'educational_metadata_quality_batch','facodi_20261115_education_context_keywords')
FROM _study_enrichment q WHERE y.id=q.youtube_row_id;

DO $post$ BEGIN
IF EXISTS(SELECT 1 FROM _study_enrichment q JOIN facodi.learning_objects lo ON lo.id=q.learning_object_id
 WHERE cardinality(lo.keywords)=0 OR
 lo.metadata->>'educational_metadata_quality_batch'<>'facodi_20261115_education_context_keywords')
OR (SELECT count(*) FROM facodi.learning_objects WHERE object_type='video'
AND nullif(btrim(description),'') IS NULL)>2
THEN RAISE EXCEPTION 'Learning metadata enrichment incomplete';END IF;
END $post$;
