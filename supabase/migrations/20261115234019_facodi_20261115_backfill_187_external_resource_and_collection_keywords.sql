
-- Fill only the search keywords that are genuinely absent.
-- Source: title, existing editorial tags, original source publisher domain.
-- No fabricated keywords, curriculum equivalence or rewritten descriptions.
CREATE TEMP TABLE _missing_resource_keywords ON COMMIT DROP AS
SELECT lo.id,lo.object_type,lo.title,lo.published,
 array(
  SELECT z.word FROM (
    SELECT term.word,min(term.ord) as first_pos
    FROM unnest(
      ARRAY[lo.title]::text[]
      || coalesce(lo.tags,'{}'::text[])
      || CASE WHEN lo.source_url ~ '^https?://[A-Za-z0-9.-]+'
       THEN ARRAY[split_part(split_part(lo.source_url,'/',3),':',1)]::text[]
       ELSE '{}'::text[] END
    ) WITH ORDINALITY AS term(word,ord)
    WHERE nullif(btrim(term.word),'') IS NOT NULL
    AND length(term.word)<=160
    AND lower(btrim(term.word)) <> ALL(ARRAY[
      'facodi','recurso-externo','leitura','documentacao',
      'curadoria','coleção temática','youtube','revisao-pendente',
      'sequencia','transcricao','transcrição','recurso complementar'])
    GROUP BY term.word
    ORDER BY min(term.ord)
    LIMIT 12
  ) z
 ) derived_keywords
FROM facodi.learning_objects lo
WHERE lo.object_type<>'video'
AND cardinality(coalesce(lo.keywords,'{}'::text[]))=0;

DO $check$ BEGIN
IF (SELECT count(*) FROM _missing_resource_keywords)<>187
OR EXISTS(SELECT 1 FROM _missing_resource_keywords
 WHERE cardinality(derived_keywords)<1)
THEN RAISE EXCEPTION 'Missing keyword count or title input changed';END IF;
END $check$;

UPDATE facodi.learning_objects lo SET
 keywords=m.derived_keywords,
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object('keywords_source','existing_title_tags_and_publisher_domain',
 'keywords_curated_by_author',false,
 'keywords_not_evidence_of_curricular_equivalence',true,
 'keywords_backfill_batch','facodi_20261115_nonvideo_keyword_quality')
FROM _missing_resource_keywords m
WHERE lo.id=m.id AND cardinality(coalesce(lo.keywords,'{}'::text[]))=0;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects
 WHERE cardinality(coalesce(keywords,'{}'::text[]))=0)<>0
OR EXISTS(SELECT 1 FROM _missing_resource_keywords m
JOIN facodi.learning_objects lo ON lo.id=m.id
WHERE lo.published IS DISTINCT FROM m.published)
THEN RAISE EXCEPTION 'Non-video keyword completeness or draft state mismatch';END IF;
END $verify$;
