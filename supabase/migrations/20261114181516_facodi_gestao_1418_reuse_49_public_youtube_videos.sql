
-- Reuse 49 existing published Tube public.videos for the UAlg Gestão degree.
-- The shared video and its FACODI learning_object are NOT duplicated.
-- Curation by title/channel only; not the official university teaching material.
CREATE TEMP TABLE _gestao_video_reuse ON COMMIT DROP AS
SELECT v.id video_id,v.youtube_id,v.title,v.channel_name,
 CASE
 WHEN v.channel_name='Educacional THM' AND v.title ~* 'Estatística Básica (0[1-9]|1[0-9])' THEN '14181187'
 WHEN v.channel_name='Educacional THM' AND v.title ~* 'Estatística Básica (2[0-9]|3[0-9])' THEN '14181191'
 WHEN v.channel_name='Professor Douglas Maioli' AND v.title ~* 'Estatística Aula 2[3-6]|Probabilidade e Estatística Aula 01' THEN '14181187'
 WHEN v.channel_name='Professor Douglas Maioli' AND v.title ~* 'Inferência Aula 27' THEN '14181191'
 WHEN v.channel_name='Prof. MURAKAMI - MATEMÁTICA RAPIDOLA' AND v.title ~* 'DISTRIBUIÇÃO BINOMIAL DE PROBABILIDADE' THEN '14181187'
 WHEN v.title ~* 'TABELA DINÂMICA|Power BI vs SQL' THEN '14181177'
 WHEN v.title ~* 'ANÁLISE MARGINAL \(Aplicação de Derivada em Economia' THEN '14181178'
 END unit_code
FROM public.videos v
WHERE
 (v.channel_name='Educacional THM' AND v.title ~* 'Estatística Básica ([0-3][0-9])')
 OR (v.channel_name='Professor Douglas Maioli' AND v.title ~* 'Estatística Aula 2[3-6]|Probabilidade e Estatística Aula 01|Inferência Aula 27')
 OR v.title ~* 'TABELA DINÂMICA|Power BI vs SQL|ANÁLISE MARGINAL \(Aplicação de Derivada em Economia|DISTRIBUIÇÃO BINOMIAL DE PROBABILIDADE';

DO $$ BEGIN
 IF (SELECT count(*) FROM _gestao_video_reuse)<>49
 OR EXISTS(SELECT 1 FROM _gestao_video_reuse WHERE unit_code IS NULL)
 THEN RAISE EXCEPTION 'Gestion video candidate set has changed'; END IF;
 IF EXISTS(SELECT 1 FROM _gestao_video_reuse s
  LEFT JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||s.video_id::text)::uuid
  WHERE lo.id IS NULL OR lo.published=false OR lo.object_type<>'video')
 THEN RAISE EXCEPTION 'A reused Tube video is missing published FACODI object'; END IF;
END $$;

INSERT INTO facodi.unit_videos
 (id,curricular_unit_id,video_id,position,metadata)
SELECT md5('facodi:gestao:uc-video:'||s.video_id::text||':'||s.unit_code)::uuid,
 u.id,s.video_id,10000+row_number() OVER (
   PARTITION BY u.id ORDER BY
     CASE WHEN s.title ~* 'Estatística Básica [0-3][0-9]'
       THEN (regexp_match(s.title,'Estatística Básica ([0-3][0-9])'))[1]::integer
       ELSE 1000 END, s.title),
 jsonb_build_object(
   'source','public.videos_reuse','review_status','approved',
   'review_scope','title_and_channel_only',
   'source_video_fully_reviewed',false,
   'content_license_verified',false,
   'academic_uc_code',s.unit_code,
   'curation_batch','facodi_ualg_gestao_2026_27',
   'publication_type','external_youtube_link',
   'official_course_video',false,
   'classification_method','visible_title_and_channel')
FROM _gestao_video_reuse s
JOIN facodi.curricular_units u ON u.code=s.unit_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
WHERE u.published AND u.status='active'
ON CONFLICT(curricular_unit_id,video_id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
  created_by_mechanism,metadata)
SELECT md5('facodi:gestao:video-relation:'||s.video_id::text||':'||s.unit_code)::uuid,
 u.learning_object_id,
 md5('facodi:video:'||s.video_id::text)::uuid,
 'contains',10000+row_number() OVER (
    PARTITION BY u.id ORDER BY
      CASE WHEN s.title ~* 'Estatística Básica [0-3][0-9]'
        THEN (regexp_match(s.title,'Estatística Básica ([0-3][0-9])'))[1]::integer
        ELSE 1000 END, s.title),
 'metadata_based_educational_curation',
 jsonb_build_object(
   'review_status','approved','review_scope','title_and_channel_only',
   'source_video_fully_reviewed',false,
   'official_course_video',false,
   'course_code','LGEST','unit_code',s.unit_code,
   'youtube_id',s.youtube_id,
   'curation_batch','facodi_ualg_gestao_2026_27')
FROM _gestao_video_reuse s
JOIN facodi.curricular_units u ON u.code=s.unit_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Classification candidate is not an AI result. Keep in editor queue for full review,
-- while the linked preview is already available as supplementary external media.
INSERT INTO facodi.video_classifications
 (id,video_id,course_id,curricular_unit_id,confidence,confidence_level,
 status,needs_review,justification,evidence,metadata)
SELECT md5('facodi:gestao:video-candidate:'||s.video_id::text||':'||s.unit_code)::uuid,
 y.id,u.course_id,u.id,0,'unassessed','needs_review',true,
 'Título e canal indicam correspondência temática para a UC. Requer revisão integral e verificação de disponibilidade.',
 jsonb_build_array(jsonb_build_object(
   'youtube_id',s.youtube_id,'channel',s.channel_name,'unit_code',s.unit_code)),
 jsonb_build_object('source','public.videos',
   'course_code','LGEST','academic_year','2026/27',
   'title_based_link_approved',true,
   'full_video_review_pending',true,
   'ai_model_used',false)
FROM _gestao_video_reuse s
JOIN facodi.curricular_units u ON u.code=s.unit_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
JOIN facodi.youtube_videos y ON y.youtube_video_id=s.youtube_id
ON CONFLICT(id) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.unit_videos uv
  JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
  JOIN facodi.courses c ON c.id=u.course_id
  WHERE c.code='LGEST')<>49
 THEN RAISE EXCEPTION 'Expected 49 shared Tube video links'; END IF;
END $$;
