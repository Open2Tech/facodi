create or replace function facodi.kf_release_reconciliation_v1()
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare item record; result jsonb:='[]'::jsonb; validation jsonb; channel_id text; mirrored integer; published_channel boolean; root_id uuid; approved_links integer; receipts integer;
begin
for item in select * from (values ('comunidade-odoo19-mrp',11,'001'),('community-odoo19-mrp',11,'001'),('comunidade-odoo19-qualidade',3,'002'),('community-odoo19-quality',3,'002')) v(slug,expected,product) loop
validation:=facodi.kf_validate_community_course_v1(item.slug,item.expected);
select id into root_id from facodi.learning_objects where slug=item.slug and published and status in ('active','published') and object_type='collection';
channel_id:='__import__.facodi_mirror_collection_'||replace(root_id::text,'-','');
select count(*) into mirrored from facodi.kf_odoo_mirror_slides_v1 d join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id and s.active and s.released where d.channel_key=channel_id;
select coalesce(bool_or(active and released),false) into published_channel from facodi.kf_odoo_mirror_state where external_id=channel_id and model='slide.channel';
select count(*) into approved_links from facodi.kf_odoo_mirror_links_v1 r join facodi.learning_objects c on c.id=r.child_object_id where r.parent_object_id=root_id and c.object_type='module';
select count(*) into receipts from facodi.kf_bridge_receipts where status='applied' and ((item.product='001' and source_task_id in (113,116)) or (item.product='002' and source_task_id in (122,123,124)));
result:=result||jsonb_build_array(jsonb_build_object('slug',item.slug,'product',item.product,'expected',item.expected,'structure_ok',coalesce((validation->>'ok')::boolean,false) and root_id is not null,'approved_links',approved_links,'mirrored',mirrored,'mirror_released',published_channel,'applied_receipts',receipts));
end loop;
return result;
end $$;
revoke all on function facodi.kf_release_reconciliation_v1() from public,anon,authenticated,service_role;
create or replace function facodi.kf_check_public_course_structure_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
result:=facodi.kf_release_reconciliation_v1();
if exists(select 1 from jsonb_array_elements(result) e where e->>'structure_ok' is distinct from 'true' or (e->>'approved_links')::integer<>(e->>'expected')::integer or (e->>'applied_receipts')::integer < case when e->>'product'='001' then 2 else 3 end) then raise exception 'KF release structure or receipt regression'; end if;
return jsonb_build_object('ok',true,'editions',result,'scope','database structure and approved relationships; mirror ledger status; not browser verification');
end $$;
revoke all on function facodi.kf_check_public_course_structure_v1() from public,anon,authenticated,service_role;
