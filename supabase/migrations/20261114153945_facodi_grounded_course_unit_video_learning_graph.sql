-- FACODI evidence-based learning graph from existing course, unit, Tube video and transcript records.
-- All new learning objects remain drafts. The 409 existing unit-video links remain pending review.
-- No Odoo data; no fabricated AI analysis, enrolments, outcomes or content licence claims.
-- Stable UUIDs derived from source UUIDs make the seed idempotent and auditable.

-- Source courses (identity verified against 2026/27 official university listings).
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,
  language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:course:'||c.id::text)::uuid,
 'course',c.title,'facodi-course-'||lower(c.code),
 c.summary,'[]'::jsonb,ARRAY[c.code],ARRAY['facodi',lower(c.code)],
 'pt','draft',false,'import',c.source_url,c.id::text,
 jsonb_build_object('import_source','facodi.courses',
   'catalog_id',c.id,'official_plan_url',c.plan_url,
   'academic_year','2026/27','curriculum_review_status','pending_editorial_approval')
FROM facodi.courses c
WHERE c.code IN ('LESTI','LDCOM') AND c.learning_object_id IS NULL
ON CONFLICT(id) DO NOTHING;

UPDATE facodi.courses c
SET learning_object_id=lo.id
FROM facodi.learning_objects lo
WHERE lo.id=md5('facodi:course:'||c.id::text)::uuid
 AND c.learning_object_id IS NULL AND c.code IN ('LESTI','LDCOM');

-- Curriculum units (including two 2026/27 elective options previously absent).
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
  status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:unit:'||u.id::text)::uuid,
 'curricular_unit',u.title,
 'facodi-uc-'||lower(c.code)||'-'||coalesce(nullif(u.code,''),left(u.id::text,8)),
 nullif(btrim(u.summary),''),'[]'::jsonb,
 ARRAY[coalesce(u.code,''),u.title],ARRAY[lower(c.code)],
 coalesce(nullif(u.language,''),'pt'),
 'draft',false,'import',u.source_url,u.id::text,
 jsonb_build_object('import_source','facodi.curricular_units',
   'catalog_id',u.id,'course_code',c.code,'unit_code',u.code,
   'year',u.year,'semester',u.semester,'ects',u.ects,
   'official_code_checked',u.metadata->'official_code_checked',
   'option_group',u.metadata->'official_option_group',
   'curriculum_review_status',
     coalesce(u.metadata->>'curriculum_review_status','pending_editorial_approval'))
FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id
WHERE c.code IN ('LESTI','LDCOM') AND u.learning_object_id IS NULL
ON CONFLICT(id) DO NOTHING;

UPDATE facodi.curricular_units u
SET learning_object_id=lo.id
FROM facodi.learning_objects lo
WHERE lo.id=md5('facodi:unit:'||u.id::text)::uuid
 AND u.learning_object_id IS NULL
 AND EXISTS(SELECT 1 FROM facodi.courses c WHERE c.id=u.course_id AND c.code IN ('LESTI','LDCOM'));

-- Eligible video list is EXACTLY the existing, unreviewed academic unit_videos relations.
-- Avoid importing 412 unrelated videos or the Odoo playlist into the FACODI graph.
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
  status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:video:'||v.id::text)::uuid,
 'video',v.title,'facodi-video-'||v.youtube_id,
 nullif(btrim(left(v.description,4000)),''),
 '[]'::jsonb,'{}'::text[],ARRAY['youtube','revisao-pendente'],
 coalesce(nullif(v.language,''),'und'),
 'draft',false,'tube','https://www.youtube.com/watch?v='||v.youtube_id,
 v.id::text,
 jsonb_build_object('import_source','public.videos',
   'tube_video_id',v.id,'youtube_video_id',v.youtube_id,
   'channel_name',v.channel_name,'duration_seconds',v.duration_seconds,
   'thumbnail_url',v.thumbnail_url,
   'curricular_match_review_status','pending_review',
   'content_verification','not_reviewed',
   'shared_video_catalogue',true)
FROM public.videos v
WHERE EXISTS(SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
 (id,learning_object_id,youtube_video_id,canonical_url,title,description,
  channel_title,duration_seconds,thumbnails,tags,language,metadata,status)
SELECT md5('facodi:youtube-video:'||v.id::text)::uuid,
       md5('facodi:video:'||v.id::text)::uuid,
       v.youtube_id,'https://www.youtube.com/watch?v='||v.youtube_id,
       v.title,nullif(btrim(left(v.description,4000)),''),
       v.channel_name,v.duration_seconds,
       CASE WHEN nullif(v.thumbnail_url,'') IS NOT NULL
         THEN jsonb_build_object('default',jsonb_build_object('url',v.thumbnail_url))
         ELSE '{}'::jsonb END,
       '{}'::text[],coalesce(nullif(v.language,''),'und'),
       jsonb_build_object('import_source','public.videos',
         'tube_video_id',v.id,'curation_status','pending_review',
         'not_an_independent_ingestion_job',true),
       'pending'
FROM public.videos v
WHERE EXISTS (SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
ON CONFLICT(youtube_video_id) DO NOTHING;

-- Source lineage: source records are preserved, not copied into public tables.
INSERT INTO facodi.legacy_object_links
 (id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:lineage:course:'||c.id::text)::uuid,
       c.learning_object_id,'facodi','courses',c.id::text,
       jsonb_build_object('created_by_seed','course_and_material_enrichment')
FROM facodi.courses c WHERE c.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.legacy_object_links
 (id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:lineage:unit:'||u.id::text)::uuid,
       u.learning_object_id,'facodi','curricular_units',u.id::text,
       jsonb_build_object('created_by_seed','course_and_material_enrichment')
FROM facodi.curricular_units u WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.legacy_object_links
 (id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:lineage:video:'||v.id::text)::uuid,
       md5('facodi:video:'||v.id::text)::uuid,
       'public','videos',v.id::text,
       jsonb_build_object('youtube_id',v.youtube_id,
          'created_by_seed','course_and_material_enrichment')
FROM public.videos v WHERE EXISTS(
 SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
ON CONFLICT DO NOTHING;

-- External references: official programme pages and YouTube canonical links.
INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:source:course:'||c.id::text)::uuid,
       c.learning_object_id,'website',c.code,c.source_url,c.title,
       jsonb_build_object('official_plan_url',c.plan_url,
         'source','Universidade do Algarve','academic_year','2026/27')
FROM facodi.courses c
WHERE c.code IN ('LESTI','LDCOM') AND c.learning_object_id IS NOT NULL
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:source:unit:'||u.id::text)::uuid,
       u.learning_object_id,'website',u.code,u.plan_url,u.title,
       jsonb_build_object('source','Universidade do Algarve',
         'academic_year','2026/27','code_verified',true)
FROM facodi.curricular_units u
WHERE u.learning_object_id IS NOT NULL
  AND (u.metadata->>'official_code_checked')='true'
  AND nullif(u.plan_url,'') IS NOT NULL
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:source:youtube:'||v.id::text)::uuid,
       md5('facodi:video:'||v.id::text)::uuid,
       'youtube',v.youtube_id,'https://www.youtube.com/watch?v='||v.youtube_id,
       v.title,jsonb_build_object('source_table','public.videos',
         'video_id',v.id,'review_status','pending_review')
FROM public.videos v
WHERE EXISTS(SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
ON CONFLICT(id) DO NOTHING;

-- Relationships: a course contains its UCs; UC-video assignments are candidates,
-- NOT vetted educational resources. Preserve candidate relation provenance.
INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
  created_by_mechanism,metadata)
SELECT md5('facodi:relation:course-unit:'||u.id::text)::uuid,
       c.learning_object_id,u.learning_object_id,'contains',
       row_number() OVER (PARTITION BY c.id ORDER BY u.year,u.semester,u.position,u.code)::integer,
       'structured_catalog_import',
       jsonb_build_object('relation_origin','facodi.curricular_units',
         'unit_code',u.code,'curriculum_review_status',
         coalesce(u.metadata->>'curriculum_review_status','pending_editorial_approval'),
         'official_option_group',u.metadata->'official_option_group')
FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id
WHERE c.learning_object_id IS NOT NULL AND u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
  created_by_mechanism,metadata)
SELECT md5('facodi:relation:unit-video:'||uv.id::text)::uuid,
       u.learning_object_id,
       md5('facodi:video:'||uv.video_id::text)::uuid,
       'contains',uv.position,
       'existing_public_playlist_mapping',
       jsonb_build_object('relation_origin','facodi.unit_videos',
         'unit_video_id',uv.id,'review_status',
         coalesce(uv.metadata->>'review_status','pending_review'),
         'source_playlist_id',uv.metadata->'source_playlist_id',
         'source_link_id',uv.metadata->'source_link_id',
         'quality','unverified_playlist_matching')
FROM facodi.unit_videos uv
JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Small, governed taxonomy. The original source categories are unverified.
INSERT INTO facodi.tags(id,slug,label,language,metadata)
SELECT md5('facodi:taxonomy:'||x.slug)::uuid,
       x.slug,x.label,'pt',
       jsonb_build_object('origin','facodi_curriculum_import',
         'taxonomy_review_status',CASE WHEN x.slug LIKE 'area-%'
           THEN 'source_category_unverified' ELSE 'system_fact' END)
FROM (VALUES
 ('curso-lesti','LESTI'),
 ('curso-ldcom','Design de Comunicação'),
 ('area-design','Design'),
 ('area-communication','Comunicação'),
 ('area-humanities','Humanidades'),
 ('area-computer-science','Informática'),
 ('area-mathematics','Matemática'),
 ('area-engineering','Engenharia'),
 ('area-management','Gestão'),
 ('origem-youtube','Vídeo YouTube'),
 ('revisao-pendente','Revisão pendente')
) AS x(slug,label)
ON CONFLICT(slug) DO NOTHING;

-- Tag courses and units according to their existing, unverified category,
-- but do not claim that these categories are officially approved.
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT c.learning_object_id,t.id
FROM facodi.courses c
JOIN facodi.tags t ON t.slug='curso-'||lower(c.code)
WHERE c.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.learning_object_id,t.id
FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id
JOIN facodi.tags t ON t.slug='curso-'||lower(c.code)
WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.learning_object_id,t.id
FROM facodi.curricular_units u
JOIN facodi.tags t ON t.slug='area-'||replace(u.metadata->>'category','_','-')
WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT lo.id,t.id
FROM facodi.learning_objects lo
JOIN facodi.tags t ON t.slug IN ('origem-youtube','revisao-pendente')
WHERE lo.object_type='video' AND lo.source_type='tube'
  AND lo.published=false
ON CONFLICT DO NOTHING;

-- Searchable, literal source titles as keywords, not invented course topics.
INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:course:'||c.id::text)::uuid,
       c.learning_object_id,c.title,lower(btrim(c.title)),'pt',1,
       'official_course_title',jsonb_build_object('source','facodi.courses')
FROM facodi.courses c WHERE c.learning_object_id IS NOT NULL
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:unit:'||u.id::text)::uuid,
       u.learning_object_id,u.title,lower(btrim(u.title)),'pt',1,
       'curricular_unit_title',jsonb_build_object('source','facodi.curricular_units')
FROM facodi.curricular_units u WHERE u.learning_object_id IS NOT NULL
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

-- Three usable transcript excerpts already exist in Tube. Keep their source
-- and automatic transcription provenance explicit; they are NOT approved course materials.
WITH transcript AS (
 SELECT DISTINCT ON (v.id) v.id video_id,v.youtube_id,v.title,
        t.id transcript_id,t.transcript_text,t.provider,t.language,t.created_at
 FROM public.video_transcripts t
 JOIN public.videos v ON v.id=t.video_id
 WHERE t.status='completed'
   AND length(coalesce(t.transcript_text,''))>200
   AND EXISTS(SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
 ORDER BY v.id,length(t.transcript_text) DESC,t.created_at DESC
)
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
  status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:transcript:'||t.transcript_id::text)::uuid,
       'document','Transcrição automática: '||left(t.title,240),
       'facodi-transcript-'||t.youtube_id,
       'Transcrição automática disponível em formato de excerto; qualidade textual e direitos de reutilização pendentes de revisão.',
       '[]'::jsonb,'{}'::text[],ARRAY['transcricao','revisao-pendente'],
       coalesce(nullif(t.language,''),'und'),
       'draft',false,'generated',
       'https://www.youtube.com/watch?v='||t.youtube_id,
       t.transcript_id::text,
       jsonb_build_object('source','public.video_transcripts',
         'transcript_id',t.transcript_id,'video_id',t.video_id,
         'provider',t.provider,'transcript_length',length(t.transcript_text),
         'review_status','pending_review','text_is_automatic',true)
FROM transcript t
ON CONFLICT(id) DO NOTHING;

WITH transcript AS (
 SELECT DISTINCT ON (v.id) v.id video_id,v.youtube_id,v.title,
        t.id transcript_id,t.transcript_text,t.provider,t.language,t.created_at
 FROM public.video_transcripts t
 JOIN public.videos v ON v.id=t.video_id
 WHERE t.status='completed'
   AND length(coalesce(t.transcript_text,''))>200
   AND EXISTS(SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
 ORDER BY v.id,length(t.transcript_text) DESC,t.created_at DESC
)
INSERT INTO facodi.documents
 (id,learning_object_id,source_url,title,mime_type,language,metadata)
SELECT md5('facodi:document:transcript:'||t.transcript_id::text)::uuid,
       md5('facodi:transcript:'||t.transcript_id::text)::uuid,
       'https://www.youtube.com/watch?v='||t.youtube_id,
       'Transcrição: '||left(t.title,240),'text/plain',t.language,
       jsonb_build_object('source_table','public.video_transcripts',
         'source_id',t.transcript_id,'provider',t.provider,
         'transcript_excerpt',t.transcript_text,
         'review_status','pending_review','full_transcript_claimed',false)
FROM transcript t
ON CONFLICT(id) DO NOTHING;

WITH transcript AS (
 SELECT DISTINCT ON (v.id) v.id video_id,t.id transcript_id
 FROM public.video_transcripts t
 JOIN public.videos v ON v.id=t.video_id
 WHERE t.status='completed'
   AND length(coalesce(t.transcript_text,''))>200
   AND EXISTS(SELECT 1 FROM facodi.unit_videos uv WHERE uv.video_id=v.id)
 ORDER BY v.id,length(t.transcript_text) DESC,t.created_at DESC
)
INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,
  created_by_mechanism,metadata)
SELECT md5('facodi:relation:transcript-video:'||t.transcript_id::text)::uuid,
       md5('facodi:transcript:'||t.transcript_id::text)::uuid,
       md5('facodi:video:'||t.video_id::text)::uuid,
       'generated_from','existing_transcript_import',
       jsonb_build_object('source_table','public.video_transcripts',
         'review_status','pending_review')
FROM transcript t
ON CONFLICT DO NOTHING;
