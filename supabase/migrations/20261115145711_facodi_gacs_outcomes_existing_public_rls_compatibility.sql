
-- Existing public RLS on learning_outcomes requires source=facodi.curricular_units.metadata.study_topics.
-- Align only the 20 already-published editorial FACODI objectives, with no policy changes.
UPDATE facodi.learning_outcomes o
SET metadata=o.metadata||jsonb_build_object(
 'source','facodi.curricular_units.metadata.study_topics',
 'editorial_proposal',true,
 'official_learning_outcome',false,
 'teacher_validated',false,
 'source_evidence','FACODI original objectives derived from editorial unit study topics and external official materials',
 'not_original_ifes_2018_learning_outcomes',true)
WHERE o.metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115'
AND (o.metadata->>'source' IS DISTINCT FROM 'facodi.curricular_units.metadata.study_topics'
 OR o.metadata->>'official_learning_outcome' IS DISTINCT FROM 'false');
DO $validate$ BEGIN
IF (SELECT count(*) FROM facodi.learning_outcomes WHERE
 metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115'
 AND metadata->>'source'='facodi.curricular_units.metadata.study_topics'
 AND metadata->>'official_learning_outcome'='false')<>20
THEN RAISE EXCEPTION '20 public editorial objectives expected';END IF;
END $validate$;