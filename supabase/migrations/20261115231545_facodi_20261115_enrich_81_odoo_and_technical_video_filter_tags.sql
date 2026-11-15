
-- Targeted filter taxonomy; no rewriting of unrelated video topics or source schema.
CREATE TEMP TABLE _topics ON COMMIT DROP AS
SELECT lo.id video_id, y.youtube_video_id, y.channel_title,lo.title,lo.tags before_tags,
ARRAY(SELECT DISTINCT pl.metadata->>'topic_tag' FROM facodi.learning_object_relations r
JOIN facodi.learning_objects pl ON pl.id=r.parent_object_id
WHERE r.child_object_id=lo.id AND r.relation_type='contains' AND pl.object_type='playlist'
AND pl.metadata->>'curation_batch'='facodi_20261115_odoo19_and_stem_study_sequences'
AND nullif(pl.metadata->>'topic_tag','') IS NOT NULL ORDER BY 1) topic_tags
FROM facodi.learning_objects lo JOIN facodi.youtube_videos y ON y.learning_object_id=lo.id
WHERE lo.published AND lo.object_type='video' AND
(y.channel_title='Odoo' OR lo.metadata->>'curation_batch'='facodi_20261115_public_source_selected_40_video_links');

DO $pre$ BEGIN
IF (SELECT count(*) FROM _topics)<>81 OR
(SELECT count(*) FROM _topics WHERE channel_title='Odoo')<>72
THEN RAISE EXCEPTION 'Expected 72 official Odoo videos and 9 selected technology videos';END IF;
END $pre$;

UPDATE facodi.learning_objects lo SET
tags=(
 SELECT array_agg(clean.tag ORDER BY clean.first_pos)
 FROM (
 SELECT t.tag,min(t.pos) first_pos FROM unnest(
    ARRAY[
     CASE WHEN src.channel_title='Odoo' THEN 'odoo' ELSE 'tecnologia' END,
     coalesce(src.topic_tags[1],CASE
       WHEN src.title ~* '(Inventory|Stock|Warehouse|Supply)' THEN 'inventario'
       WHEN src.title ~* '(Helpdesk|Ticket|Field Service)' THEN 'helpdesk'
       WHEN src.title ~* '(Employee|Recruit|Applicant|Job|Salary|Payroll|Time Off|Appraisal|Attendance|Referral|Fleet|Offboard)' THEN 'recursos-humanos'
       WHEN src.title ~* 'Point of Sale' THEN 'ponto-de-venda'
       ELSE NULL END),
     CASE WHEN src.channel_title='Odoo' THEN 'erp' ELSE 'desenvolvimento' END,
     CASE WHEN src.channel_title='Odoo' THEN 'gestao' ELSE NULL END
    ]::text[] || coalesce(src.topic_tags,'{}'::text[]) ||
    coalesce(lo.tags,'{}'::text[])
 ) WITH ORDINALITY t(tag,pos)
 WHERE nullif(btrim(t.tag),'') IS NOT NULL
 GROUP BY t.tag
 ) clean),
metadata=coalesce(lo.metadata,'{}'::jsonb)||jsonb_build_object(
'filter_taxonomy_review','topic_source_associations',
'tags_refreshed_at','2026-11-15',
'tags_batch','facodi_20261115_odoo_and_technology_filter_taxonomy')
FROM _topics src WHERE lo.id=src.video_id;

UPDATE facodi.youtube_videos yt SET tags=lo.tags,metadata=coalesce(yt.metadata,'{}'::jsonb)||
jsonb_build_object('tags_refreshed_at','2026-11-15','tags_source','facodi_editorial_video_topic_relations')
FROM facodi.learning_objects lo JOIN _topics src ON src.video_id=lo.id
WHERE yt.learning_object_id=lo.id;

-- Existing five RH sequences also receive meaningful first-class filter tags.
UPDATE facodi.learning_objects lo SET
tags=ARRAY['odoo','recursos-humanos','erp','gestao','tecnologia'] ||
 ARRAY(SELECT t FROM unnest(coalesce(lo.tags,'{}'::text[])) t
 WHERE t <> ALL(ARRAY['odoo','recursos-humanos','erp','gestao','tecnologia'])),
metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object('tags_batch','facodi_20261115_odoo_and_technology_filter_taxonomy')
WHERE lo.slug IN (
 'facodi-playlist-rh-assiduidade-erp','facodi-playlist-rh-cadastro-erp',
 'facodi-playlist-rh-desempenho-erp','facodi-playlist-rh-recrutamento-erp',
 'facodi-playlist-rh-remuneracoes-erp')
AND lo.object_type='playlist' AND lo.published;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects lo
JOIN _topics x ON x.video_id=lo.id
WHERE (x.channel_title='Odoo' AND NOT lo.tags @> ARRAY['odoo','erp']::text[])
OR (x.channel_title<>'Odoo' AND NOT lo.tags @> ARRAY['tecnologia']::text[]))>0
OR (SELECT count(*) FROM facodi.learning_objects WHERE object_type='playlist'
AND metadata->>'tags_batch'='facodi_20261115_odoo_and_technology_filter_taxonomy')<>5
THEN RAISE EXCEPTION 'Odoo and technology topic labels incomplete';END IF;
END $verify$;
