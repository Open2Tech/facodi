
create or replace function facodi.kf_mirror_escape(v text) returns text language sql immutable security invoker set search_path='' as $$ select replace(replace(replace(replace(coalesce(v,''),'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;') $$;
revoke all on function facodi.kf_mirror_escape(text) from public,anon,authenticated,service_role;
create table if not exists facodi.kf_odoo_mirror_state (
 external_id text primary key,
 model text not null check(model in ('slide.channel','slide.slide')),
 channel_key text,
 remote_id integer not null,
 content_hash text not null,
 active boolean not null default true,
 released boolean not null default false,
 synced_at timestamptz not null default now()
);
alter table facodi.kf_odoo_mirror_state enable row level security;
revoke all on facodi.kf_odoo_mirror_state from public,anon,authenticated,service_role;
create or replace view facodi.kf_odoo_mirror_objects_v1 with (security_invoker=true) as
select o.id,o.object_type,o.slug,o.title,o.language,o.source_url, o.description,o.metadata,
case when o.object_type='course' and c.id is not null then 'https://facodi.com/courses/'||c.slug
when o.object_type='curricular_unit' and u.id is not null then 'https://facodi.com/courses/'||uc.slug||'/units/'||u.slug
when o.object_type='playlist' then 'https://facodi.com/sequences/'||o.slug
when o.object_type='module' then 'https://facodi.com/modules/'||o.slug
else 'https://facodi.com/resources/'||o.slug end as canonical_url
from facodi.learning_objects o
left join facodi.courses c on c.learning_object_id=o.id and o.object_type='course' and c.published
left join facodi.curricular_units u on u.learning_object_id=o.id and o.object_type='curricular_unit' and u.published
left join facodi.courses uc on uc.id=u.course_id and uc.published
where o.published and o.status in ('active','published');
revoke all on facodi.kf_odoo_mirror_objects_v1 from public,anon,authenticated,service_role;
create or replace view facodi.kf_odoo_mirror_channels_v1 with (security_invoker=true) as
select '__import__.facodi_mirror_course_'||replace(c.learning_object_id::text,'-','') as external_id,
c.title as title, '<p>FACODI · Curso académico · '||facodi.kf_mirror_escape(c.institution)||'</p><p><a href="https://facodi.com/courses/'||facodi.kf_mirror_escape(c.slug)||'">Plano curricular e conteúdos no FACODI</a></p>' description, 10 priority
from facodi.courses c join facodi.kf_odoo_mirror_objects_v1 o on o.id=c.learning_object_id where c.published
union all
select '__import__.facodi_mirror_collection_'||replace(o.id::text,'-',''),o.title,'<p>FACODI · Coleção / caminho de aprendizagem · '||facodi.kf_mirror_escape(o.language)||'</p><p><a href="'||facodi.kf_mirror_escape(o.canonical_url)||'">Abrir coleção original no FACODI</a></p>',case when o.metadata->'presentation'->>'kind'='community_course' then 1 else 20 end from facodi.kf_odoo_mirror_objects_v1 o where o.object_type='collection'
union all
select '__import__.facodi_mirror_library_'||v.kind,'FACODI · Biblioteca — '||v.label,'<p>Índice sincronizado de objetos de conhecimento publicados. O FACODI permanece a fonte de verdade.</p><p><a href="https://facodi.com/resources">Explorar biblioteca FACODI</a></p>',30 from (values ('video','Vídeos'),('playlist','Sequências'),('document','Documentos'),('external_resource','Referências externas'),('module','Módulos'),('topic','Temas')) v(kind,label);
revoke all on facodi.kf_odoo_mirror_channels_v1 from public,anon,authenticated,service_role;
create or replace view facodi.kf_odoo_mirror_links_v1 with (security_invoker=true) as
select r.parent_object_id,r.child_object_id,r.position
from facodi.learning_object_relations r join facodi.kf_odoo_mirror_objects_v1 p on p.id=r.parent_object_id join facodi.kf_odoo_mirror_objects_v1 c on c.id=r.child_object_id
where r.relation_type='contains' and (
 r.created_by_mechanism='structured_catalog_import'
 or (r.metadata->>'review_status'='approved' and (r.metadata->>'review_scope'='title_and_channel_only' or r.created_by_mechanism='existing_public_playlist_mapping'))
 or (r.created_by_mechanism='verified_external_reading_curation' and r.metadata->>'review_status'='approved' and r.metadata->>'review_scope'='external_landing_page' and p.object_type='curricular_unit' and c.object_type='external_resource')
 or (r.metadata->>'review_status'='approved' and r.metadata->>'review_scope'='playlist_item_editorial_approval' and p.object_type='curricular_unit' and c.object_type='video')
 or (r.created_by_mechanism='resource_suggestion_review' and r.metadata->>'review_status'='approved' and p.object_type='curricular_unit')
 or (r.created_by_mechanism='knowledge_factory' and r.metadata->>'review_status'='approved' and r.metadata->>'review_scope'='community_course_release' and p.metadata->>'editorial_batch'='facodi-kf-mrp19-20261126' and c.metadata->>'editorial_batch'='facodi-kf-mrp19-20261126' and p.object_type in ('collection','module') and c.object_type in ('module','document','video'))
);
revoke all on facodi.kf_odoo_mirror_links_v1 from public,anon,authenticated,service_role;
create or replace view facodi.kf_odoo_mirror_slides_v1 with (security_invoker=true) as
with entries as (
 select '__import__.facodi_mirror_uc_'||replace(u.id::text,'-','') external_id,'__import__.facodi_mirror_course_'||replace(c.learning_object_id::text,'-','') channel_key,u.learning_object_id oid,u.title title,coalesce(u.year,0)*10000+coalesce(u.semester,0)*1000+coalesce(u.position,0)+100 as seq,10 priority,
 '<p>Ano: '||coalesce(u.year::text,'—')||' · Semestre: '||coalesce(u.semester::text,'—')||' · ECTS: '||coalesce(u.ects::text,'—')||'</p>' extra
 from facodi.curricular_units u join facodi.courses c on c.id=u.course_id and c.published join facodi.kf_odoo_mirror_objects_v1 o on o.id=u.learning_object_id where u.published
 union all
 select '__import__.facodi_mirror_member_'||replace(p.id::text,'-','')||'_'||replace(c.id::text,'-',''),'__import__.facodi_mirror_collection_'||replace(p.id::text,'-',''),c.id,c.title,coalesce(r.position,0)+1,case when p.metadata->'presentation'->>'kind'='community_course' then 1 else 20 end,''
 from facodi.kf_odoo_mirror_links_v1 r join facodi.kf_odoo_mirror_objects_v1 p on p.id=r.parent_object_id and p.object_type='collection' join facodi.kf_odoo_mirror_objects_v1 c on c.id=r.child_object_id
 union all
 select '__import__.facodi_mirror_object_'||replace(o.id::text,'-',''),'__import__.facodi_mirror_library_'||o.object_type,o.id,o.title,10,30,'' from facodi.kf_odoo_mirror_objects_v1 o where o.object_type in ('video','playlist','document','external_resource','module','topic')
)
select e.external_id,e.channel_key,e.title,e.seq,e.priority,
 '<p>FACODI · '||facodi.kf_mirror_escape(o.object_type)||' · '||facodi.kf_mirror_escape(o.language)||'</p>'||e.extra||
 '<p><a href="'||facodi.kf_mirror_escape(o.canonical_url)||'">Abrir conteúdo completo no FACODI</a></p>'||
 case when nullif(o.description,'') is not null then '<p>'||facodi.kf_mirror_escape(left(regexp_replace(o.description,'<[^>]+>',' ','g'),1800))||'</p>' else '' end||
 case when o.source_url ~ '^https://[^[:space:]<>"]+$' then '<p><a href="'||facodi.kf_mirror_escape(o.source_url)||'">Fonte original</a></p>' else '' end||
 case when links.list is not null then '<h3>Conteúdos associados</h3><ul>'||links.list||'</ul><p>Consultar a página original para a lista completa e experiência interativa.</p>' else '' end||
 '<p>UUID: '||o.id::text||'</p>' as html_content
from entries e join facodi.kf_odoo_mirror_objects_v1 o on o.id=e.oid
left join lateral (select string_agg('<li><a href="'||facodi.kf_mirror_escape(x.canonical_url)||'">'||facodi.kf_mirror_escape(x.title)||'</a></li>','' order by x.position,x.title) list from (select c.canonical_url,c.title,r.position from facodi.kf_odoo_mirror_links_v1 r join facodi.kf_odoo_mirror_objects_v1 c on c.id=r.child_object_id where r.parent_object_id=o.id order by r.position,c.title limit 60) x) links on true;
revoke all on facodi.kf_odoo_mirror_slides_v1 from public,anon,authenticated,service_role;

