
-- Restore deterministic order for affected Ifes modules only; progress untouched.
CREATE TEMP TABLE _ordered_module_ids ON COMMIT DROP AS
SELECT DISTINCT id FROM (
 SELECT p.id,c.object_type
 FROM facodi.learning_objects p
 JOIN facodi.learning_object_relations r ON r.parent_object_id=p.id AND r.relation_type='contains'
 JOIN facodi.learning_objects c ON c.id=r.child_object_id AND c.published AND c.status='active'
 WHERE p.object_type='module' AND p.published AND p.status='active'
   AND p.slug LIKE 'ifes-adm26-%'
 GROUP BY p.id,c.object_type
 HAVING count(*) > count(distinct r.position)
 OR count(*) FILTER(WHERE r.position IS NULL)>0
) x;
CREATE TEMP TABLE _ordered_module_links ON COMMIT DROP AS
SELECT a.id parent_id,r.id rel_id,r.position prior_position,
row_number() OVER(PARTITION BY a.id ORDER BY r.position NULLS LAST,r.created_at,r.id)::int new_position
FROM _ordered_module_ids a JOIN facodi.learning_object_relations r
ON r.parent_object_id=a.id AND r.relation_type='contains';

DO $pre$ BEGIN
IF (SELECT count(*) FROM _ordered_module_ids)<>9
 OR EXISTS(SELECT 1 FROM _ordered_module_ids a JOIN facodi.study_module_progress mp ON mp.module_id=a.id)
 OR EXISTS(SELECT 1 FROM _ordered_module_ids a JOIN facodi.learning_object_relations r ON r.parent_object_id=a.id AND r.relation_type='contains'
 LEFT JOIN facodi.learning_objects c ON c.id=r.child_object_id
 WHERE c.id IS NULL OR NOT c.published OR c.status<>'active')
 THEN RAISE EXCEPTION 'Module population or study progress changed';END IF;
END $pre$;

UPDATE facodi.learning_object_relations r SET
position=l.new_position,
metadata=coalesce(r.metadata,'{}'::jsonb)||
jsonb_build_object('previous_position_before_20261115',l.prior_position,
'ordering_audit','dense_stable_module_order',
'ordering_basis','previous_position_then_creation_then_relation_id')
FROM _ordered_module_links l
WHERE r.id=l.rel_id AND r.position IS DISTINCT FROM l.new_position;

UPDATE facodi.learning_objects m SET metadata=coalesce(m.metadata,'{}'::jsonb)||
jsonb_build_object('content_order_audited_20261115',true,
'ordering_policy','prior_position_and_creation_order_preserved')
FROM _ordered_module_ids a WHERE m.id=a.id;

DO $verify$ BEGIN
IF EXISTS(
 SELECT 1 FROM (
 SELECT l.parent_id,count(*) n,min(r.position) mn,max(r.position) mx,
 count(distinct r.position) uniq
 FROM _ordered_module_links l JOIN facodi.learning_object_relations r ON r.id=l.rel_id
 GROUP BY l.parent_id
 ) x WHERE x.mn<>1 OR x.mx<>x.n OR x.uniq<>x.n)
 THEN RAISE EXCEPTION 'Module order verification failed';END IF;
END $verify$;
