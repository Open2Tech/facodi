
-- FACODI reuse of independently curated, original Tube YouTube links.
-- No file copies, generated exercises, Odoo certifications, or claimed university endorsement.
CREATE TEMP TABLE _candidate_manifest ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset('[{"id":"MbwCZ6-H6Dw","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"ie9X1MNUFcs","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"vYyl77YzRwY","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"vlVKTeokFO4","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"ZmEFgl3N2vY","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"0Uj0n0ERx6I","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"hXkmv9MdeRg","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"_oFiIVuXV7k","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"vSOihwvGf_4","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"CmztKGWVph0","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"sCTea1IkIl4","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"WXn5il2wB0o","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"-xHbo21qjJI","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"_MkDQ7hrDn0","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"bUcuZork1XY","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"qcCQOCjGvT0","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"OZLP-SCHW7A","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"LYsD1EaE1pA","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"idf86c350U0","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"IMTzJoWrtU0","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"q9dmuj9huFk","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"wZducJaKuGI","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"ydg64NYZZzI","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"TV0k3ro2sjI","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"pBlGLhBoRvY","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"oQRxU4puI34","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"ot51_hzEptc","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"qjfJXsg_zSA","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"zFNHNHI2p6M","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"M8BSg8VMta4","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"W3K_9S3Qsj8","group":"odoo-official","channel":"Odoo","language":"en"},{"id":"xj_GjnD4uyI","group":"redes","channel":"TechWorld with Nana","language":"en"},{"id":"p9L7YFqHGk4","group":"dev-containers","channel":"Visual Studio Code","language":"en"},{"id":"SYU8tT_WqIY","group":"python-ambientes","channel":"Daxus | Empowerdata Python","language":"pt"},{"id":"EoQFKtPz15Y","group":"python-distribuicao","channel":"Eduardo Mendes (Dunossauro)","language":"pt"},{"id":"viURaw3oiBA","group":"low-code","channel":"Directus","language":"en"},{"id":"Ab01W6h4Giw","group":"react-routing","channel":"Austin Davis","language":"en"},{"id":"cVAB6Dj341E","group":"cloud-deploy","channel":"Astra Online","language":"pt"},{"id":"cr-MWnAXtiQ","group":"odoo-helpdesk-custom","channel":"Odoo Tech","language":"en"},{"id":"LlwvC8IxTaM","group":"odoo-webhooks-v18","channel":"Nicholas Kosinski","language":"en"}]'::jsonb)
AS t(id text,"group" text,channel text,language text);

DO $validate$ DECLARE bad text; BEGIN
IF (SELECT count(*) FROM _candidate_manifest)<>40 OR
(SELECT count(*) FROM _candidate_manifest WHERE "group"='odoo-official')<>31 OR
EXISTS(SELECT 1 FROM _candidate_manifest GROUP BY id HAVING count(*)>1) OR
EXISTS(SELECT 1 FROM _candidate_manifest m LEFT JOIN public.videos v ON v.youtube_id=m.id
  WHERE v.id IS NULL OR m.id !~ '^[A-Za-z0-9_-]{11}$' OR nullif(btrim(v.title),'') IS NULL) OR
EXISTS(SELECT 1 FROM _candidate_manifest m JOIN public.videos v ON v.youtube_id=m.id
  WHERE m."group"='odoo-official' AND v.channel_name<>'Odoo') OR
EXISTS(SELECT 1 FROM _candidate_manifest m JOIN facodi.youtube_videos y ON y.youtube_video_id=m.id) OR
EXISTS(SELECT 1 FROM _candidate_manifest m JOIN public.videos v ON v.youtube_id=m.id
  JOIN facodi.learning_objects lo ON lo.source_type='tube' AND lo.source_id=v.id::text)
THEN RAISE EXCEPTION 'Forty unique source videos absent from FACODI required';END IF;
END $validate$;

INSERT INTO facodi.learning_objects(id,object_type,title,slug,description,objectives,keywords,tags,
  language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:tube-video:'||v.youtube_id)::uuid,
'video',v.title,'facodi-video-'||v.youtube_id,
'Vídeo externo do canal '||m.channel||'. Recurso complementar para estudo e discussão; versão do software, funcionalidades, disponibilidade e contexto devem ser conferidos na fonte original.',
'[]'::jsonb, ARRAY[v.title,m.channel,m."group"],
ARRAY['youtube','recurso-externo','curadoria-facodi',
 CASE WHEN m."group"='odoo-official' THEN 'odoo' ELSE 'tecnologia' END,
 CASE WHEN m."group"='odoo-official' THEN 'erp' ELSE m."group" END],
m.language,'active',true,'tube',
'https://www.youtube.com/watch?v='||v.youtube_id,v.id::text,
jsonb_build_object(
'youtube_video_id',v.youtube_id,'channel_name',m.channel,'tube_video_id',v.id,
'source_origin','public.videos','source_channel_title_from_tube',v.channel_name,
'creator_name_reviewed',m."group" IN ('python-distribuicao','dev-containers','redes'),
'authoritative_official_channel_recorded_in_tube',m."group"='odoo-official',
'content_version_verified',false,'playback_verified',false,'embed_verified',false,
'full_video_reviewed',false,'content_license_verified',false,
'video_files_copied',false,'curation_scope','title_channel_topic_and_source_context',
'curation_batch','facodi_20261115_public_source_selected_40_video_links')
FROM _candidate_manifest m JOIN public.videos v ON v.youtube_id=m.id;

INSERT INTO facodi.youtube_videos(id,learning_object_id,youtube_video_id,canonical_url,title,
description,channel_title,duration_seconds,language,status,thumbnails,metadata)
SELECT md5('facodi:youtube:'||v.youtube_id)::uuid,
md5('facodi:tube-video:'||v.youtube_id)::uuid,v.youtube_id,
'https://www.youtube.com/watch?v='||v.youtube_id,v.title,
nullif(v.description,''),m.channel,v.duration_seconds,m.language,'published',
jsonb_build_object('default',jsonb_build_object('url','https://i.ytimg.com/vi/'||v.youtube_id||'/hqdefault.jpg')),
jsonb_build_object(
'source_origin','public.videos','source_video_id',v.id,'official_odoo_channel',m."group"='odoo-official',
'channel_name_in_tube',v.channel_name,
'metadata_verified_from_youtube_og',false,'full_video_reviewed',false,
'playback_verified',false,'embed_verified',false,'language_review_status','inferred_from_title',
'curation_batch','facodi_20261115_public_source_selected_40_video_links')
FROM _candidate_manifest m JOIN public.videos v ON v.youtube_id=m.id;

INSERT INTO facodi.legacy_object_links(id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:tube-link:'||v.id::text)::uuid,
md5('facodi:tube-video:'||v.youtube_id)::uuid,'public','videos',v.id::text,
jsonb_build_object('source_youtube_id',v.youtube_id,
  'curation_batch','facodi_20261115_public_source_selected_40_video_links')
FROM _candidate_manifest m JOIN public.videos v ON v.youtube_id=m.id;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.youtube_videos y JOIN _candidate_manifest m ON m.id=y.youtube_video_id
  WHERE y.status='published')<>40
OR (SELECT count(*) FROM facodi.learning_objects lo JOIN _candidate_manifest m ON lo.slug='facodi-video-'||m.id
 WHERE lo.object_type='video' AND lo.published AND lo.status='active')<>40
OR (SELECT count(*) FROM facodi.legacy_object_links l JOIN public.videos v ON l.legacy_id=v.id::text
 JOIN _candidate_manifest m ON m.id=v.youtube_id WHERE l.legacy_table='videos' AND l.legacy_schema='public')<>40
THEN RAISE EXCEPTION 'Video import incomplete'; END IF;
END $verify$;
