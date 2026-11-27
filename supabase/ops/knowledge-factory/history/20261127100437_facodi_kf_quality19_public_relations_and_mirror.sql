create policy facodi_public_read_kf_quality19_approved_links on facodi.learning_object_relations for select to anon,authenticated using (
 relation_type='contains' and created_by_mechanism='knowledge_factory' and metadata->>'review_status'='approved' and metadata->>'review_scope'='community_course_release'
 and exists(select 1 from facodi.learning_objects p join facodi.learning_objects c on c.id=child_object_id where p.id=parent_object_id and p.published and c.published and p.status in ('active','published') and c.status in ('active','published') and p.metadata->>'editorial_batch'='facodi-kf-quality19-20261127' and c.metadata->>'editorial_batch'='facodi-kf-quality19-20261127' and p.language=c.language and ((p.object_type='collection' and c.object_type='module') or (p.object_type='module' and c.object_type='document')))
);
do $m$ declare s text; begin
select pg_get_viewdef('facodi.kf_odoo_mirror_links_v1'::regclass,true) into s;
s:=replace(s,'(p.metadata ->> ''editorial_batch''::text) = ''facodi-kf-mrp19-20261126''::text AND (c.metadata ->> ''editorial_batch''::text) = ''facodi-kf-mrp19-20261126''::text','(p.metadata ->> ''editorial_batch''::text) IN (''facodi-kf-mrp19-20261126'',''facodi-kf-quality19-20261127'') AND (c.metadata ->> ''editorial_batch''::text) = (p.metadata ->> ''editorial_batch''::text)');
if position('facodi-kf-quality19-20261127' in s)=0 then raise exception 'Unexpected mirror view'; end if;
execute 'create or replace view facodi.kf_odoo_mirror_links_v1 with (security_invoker=true) as '||s; end $m$;
revoke all on facodi.kf_odoo_mirror_links_v1 from public,anon,authenticated,service_role;
