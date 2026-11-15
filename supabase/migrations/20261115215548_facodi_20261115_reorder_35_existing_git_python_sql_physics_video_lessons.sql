
-- Reorder reviewed public video links only, keeping video UUIDs and user progress.
CREATE TEMP TABLE _positions ON COMMIT DROP AS
SELECT x.value->>0 slug,v.value youtube_id,v.ordinality::int new_position
FROM jsonb_array_elements('[["facodi-playlist-git-fundamentos-colaboracao",["xEKo29OWILE","hwP7WQkmECE","HkdAHXoRtos","Ala6PHlYjmw","Lf7846MlOkY","InKNIvky2KE","K5Ux_m0ccuo","O3bs4JtHrow","yqsGbfvbMcQ","L1f6N6NcgPw"]],["facodi-playlist-python-iniciacao-ambientes",["S9uPNppGsGo","Mp0vhMDI7fA","31llNGKWDdo","hdDHg1p3YVc","Vw6gLypRKmY","FNqdV5Zb_5Q","PB254Cfjlyk","rfscVS0vtbw","naGF7EIUFp0","ZOSWdktsKf0","O3bs4JtHrow","MjQCvJmc31A"]],["facodi-playlist-sql-relacional-fundamentos",["Ofktsne-utM","N_0ujgVRrdI","SLY_ZcNYjIY","m9YPlX0fcJk","Yvw60m0E9D8","GeaIMnCbRPQ","zgNQrW6OhMU","HmFUrlQcCJ0","tBJsOkGe4fE"]],["facodi-science-fisica-vetores-cinematica",["lAAfjtnc7bI","5rXU-Z_ojfM","1OLBTHDqWIE","pGSRpeapO2w"]]]'::jsonb) x(value)
CROSS JOIN LATERAL jsonb_array_elements_text(x.value->1) WITH ORDINALITY v(value,ordinality);
CREATE TEMP TABLE _edge_positions ON COMMIT DROP AS
SELECT m.slug,m.new_position,m.youtube_id,r.id edge_id,r.position old_position,pl.id playlist_id
FROM _positions m
JOIN facodi.learning_objects pl ON pl.slug=m.slug AND pl.object_type='playlist' AND pl.published
JOIN facodi.youtube_videos yt ON yt.youtube_video_id=m.youtube_id AND yt.status='published'
JOIN facodi.learning_objects v ON v.id=yt.learning_object_id AND v.published AND v.object_type='video'
JOIN facodi.learning_object_relations r ON r.parent_object_id=pl.id
AND r.child_object_id=v.id AND r.relation_type='contains'
AND r.metadata->>'review_status'='approved' AND r.metadata->>'review_scope'='title_and_channel_only';

DO $guard$ BEGIN
IF (SELECT count(*) FROM _positions)<>35 OR (SELECT count(*) FROM _edge_positions)<>35
OR EXISTS(SELECT 1 FROM _positions GROUP BY slug,youtube_id HAVING count(*)>1)
OR EXISTS(
 SELECT 1 FROM (
 SELECT p.id,count(*) n FROM facodi.learning_objects p
 JOIN facodi.learning_object_relations r ON r.parent_object_id=p.id AND r.relation_type='contains'
 JOIN facodi.learning_objects v ON v.id=r.child_object_id AND v.object_type='video'
 WHERE p.slug IN (SELECT DISTINCT slug FROM _positions)
 GROUP BY p.id) total
 LEFT JOIN (SELECT playlist_id,count(*) n FROM _edge_positions GROUP BY playlist_id) mapped
 ON mapped.playlist_id=total.id WHERE total.n<>mapped.n)
THEN RAISE EXCEPTION 'Existing approved source video sequences changed';END IF;
END $guard$;

UPDATE facodi.learning_object_relations r SET
position=m.new_position,
metadata=coalesce(r.metadata,'{}'::jsonb)||
jsonb_build_object('previous_position_before_20261115_topic_reorder',m.old_position,
'ordering_basis','fundamental_concepts_to_practical_and_advanced_lessons',
'ordering_batch','facodi_20261115_topic_reorder')
FROM _edge_positions m
WHERE r.id=m.edge_id AND r.position IS DISTINCT FROM m.new_position;

UPDATE facodi.learning_objects p SET metadata=coalesce(p.metadata,'{}'::jsonb)||
jsonb_build_object('ordering_policy','fundamentals_then_examples_then_advanced',
 'last_order_review','2026-11-15')
WHERE p.id IN (SELECT DISTINCT playlist_id FROM _edge_positions);

DO $verify$ BEGIN
IF EXISTS(SELECT 1 FROM _edge_positions p JOIN facodi.learning_object_relations r ON r.id=p.edge_id
WHERE r.position IS DISTINCT FROM p.new_position)
OR EXISTS(SELECT 1 FROM (
 SELECT playlist_id,count(*) total,min(r.position) mn,max(r.position) mx,count(distinct r.position) uniq
 FROM _edge_positions p JOIN facodi.learning_object_relations r ON r.id=p.edge_id
 GROUP BY playlist_id) x WHERE mn<>1 OR mx<>total OR uniq<>total)
THEN RAISE EXCEPTION 'Reordered sequence positions are not dense and correct';END IF;
END $verify$;
