create or replace view facodi.kf_curricular_triage_v1 with (security_invoker=true) as
select u.id unit_id,u.learning_object_id,u.title unit_title,c.slug course_slug,c.title course_title,u.language,u.source_url,
case when lower(extensions.unaccent(u.title)) ~ '(^|[^a-z])(estagio|projeto|projecto|dissertacao|tese|opcao|optativa|seminario|praticas profissionais)([^a-z]|$)' then 'modality_review'
when length(trim(u.title))<5 then 'manual_review'
else 'resource_discovery' end as route,
(select count(*) from facodi.kf_odoo_mirror_links_v1 r where r.parent_object_id=u.learning_object_id) as public_direct_relations
from facodi.curricular_units u join facodi.courses c on c.id=u.course_id where u.published and c.published
and not exists(select 1 from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=u.learning_object_id and r.relation_type='contains' and o.object_type='playlist' and o.published)
and not exists(select 1 from facodi.unit_videos v where v.curricular_unit_id=u.id);
revoke all on facodi.kf_curricular_triage_v1 from public,anon,authenticated,service_role;
create or replace view facodi.kf_resource_candidates_v1 with (security_invoker=true) as
with targets as materialized (select *,trim(regexp_replace(lower(extensions.unaccent(unit_title)),'[^a-z0-9]+',' ','g')) norm from facodi.kf_curricular_triage_v1 where route='resource_discovery'),
resources as materialized (select id,title,slug,object_type,language,source_url,trim(regexp_replace(lower(extensions.unaccent(title)),'[^a-z0-9]+',' ','g')) norm from facodi.learning_objects where published and status in ('active','published') and object_type in ('playlist','video') and source_url ~ '^https://'),
donors as materialized (select u.id,u.learning_object_id,u.title,c.slug course_slug,trim(regexp_replace(lower(extensions.unaccent(u.title)),'[^a-z0-9]+',' ','g')) norm from facodi.curricular_units u join facodi.courses c on c.id=u.course_id where u.published and c.published),
hits as (
select t.unit_id,t.unit_title,t.course_slug,r.id resource_id,r.title resource_title,r.slug resource_slug,r.object_type,r.language resource_language,r.source_url,100 score,'same_unit_title_existing_public_relation' evidence,d.course_slug donor_course
from targets t join donors d on d.norm=t.norm and d.id<>t.unit_id join facodi.kf_odoo_mirror_links_v1 l on l.parent_object_id=d.learning_object_id join resources r on r.id=l.child_object_id
union all
select t.unit_id,t.unit_title,t.course_slug,r.id,r.title,r.slug,r.object_type,r.language,r.source_url,case when r.norm=t.norm then 90 else 70 end,'resource_title_match',null::text
from targets t join resources r on length(t.norm)>=8 and (' '||r.norm||' ') like ('% '||t.norm||' %')
), dedup as (select distinct on(unit_id,resource_id) * from hits h where not exists(select 1 from facodi.learning_object_relations l join targets t on t.unit_id=h.unit_id where l.parent_object_id=t.learning_object_id and l.child_object_id=h.resource_id) order by unit_id,resource_id,score desc,donor_course nulls last)
select *,row_number() over(partition by unit_id order by score desc,case when object_type='playlist' then 0 else 1 end,resource_title,resource_id) candidate_rank from dedup;
revoke all on facodi.kf_resource_candidates_v1 from public,anon,authenticated,service_role;
