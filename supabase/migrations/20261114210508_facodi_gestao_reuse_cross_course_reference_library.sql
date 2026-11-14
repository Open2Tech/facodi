-- Reuse existing published FACODI reference objects to enrich Gestão.
-- Do not duplicate objects or alter previously published course relationships.
CREATE TEMP TABLE _lg_reuse(source_id text PRIMARY KEY,uc_codes text) ON COMMIT DROP;
INSERT INTO _lg_reuse VALUES ('ctesp1812-powerbi','14181177,14181196,14181197,14181184,14191202,14181164'),
('ctesp1812-libreoffice','14181177,14181196'),
('ctesp1812-analytics','14181188,14181198,15161110,14181196'),
('ctesp1812-google-seo','14181198,15161110,15161109,14181188'),
('english-email-bc','14181182,15161109'),
('english-writing-bc','14181182,15161109'),
('ctesp1812-communication','14181183,15161098,15161102,14181182'),
('project-management-openlearn','14181194,14181031,14181164,14181093'),
('openstax-calc-one','14181178,14181180'),
('openstax-calc-three','14181181'),
('openstax-stats','14181187,14181191'),
('ctesp1812-powerautomate','14181196,14181197,14181164'),
('design-double-diamond','14181168,14181164'),
('openstax-management','14181179,14181183,14181093,14181194'),
('openstax-marketing','14181188,15161047,14181198,15161110,15161102');
DO $$ BEGIN
 IF (SELECT count(*) FROM _lg_reuse)<>15 THEN RAISE EXCEPTION 'Expected 15 source mappings'; END IF;
 IF EXISTS(SELECT 1 FROM _lg_reuse s WHERE NOT EXISTS (
   SELECT 1 FROM facodi.learning_objects lo
   WHERE lo.source_id=s.source_id AND lo.published AND lo.status='active'
   AND lo.object_type='external_resource'))
 THEN RAISE EXCEPTION 'One original source is unavailable'; END IF;
END $$;
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:existing_reading:'||s.source_id||':'||u.code)::uuid,
u.learning_object_id,lo.id,'contains',
7500+row_number() OVER(PARTITION BY u.id ORDER BY s.source_id)::int,
'verified_external_reading_curation',
jsonb_build_object('review_status','approved','review_scope','external_landing_page',
'resource_reused_from_facodi',true,'original_source_id',s.source_id,
'content_reproduced',false,'publication_type','external_reference_link_only',
'official_university_approved_content',false)
FROM _lg_reuse s
JOIN facodi.learning_objects lo ON lo.source_id=s.source_id
 AND lo.published AND lo.status='active' AND lo.object_type='external_resource'
JOIN facodi.curricular_units u ON u.code=ANY(string_to_array(s.uc_codes,','))
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
WHERE u.published AND u.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
