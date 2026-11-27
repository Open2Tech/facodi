create extension if not exists http with schema extensions;
create or replace function facodi.kf_push_operational_snapshot() returns integer
language plpgsql security invoker set search_path = '' as $$
declare target text; metrics jsonb; result_status integer;
begin
  select decrypted_secret into target from vault.decrypted_secrets where name='facodi_kf_snapshot_webhook';
  if target is null or target !~ '^https://edu-facodi[.]odoo[.]com/web/hook/[A-Za-z0-9_-]+$' then raise exception 'KF webhook not configured'; end if;
  select jsonb_build_object(
    'schema_version',1,
    'published_objects',(select count(*) from facodi.learning_objects where published),
    'courses',(select count(*) from facodi.courses where published),
    'units',(select count(*) from facodi.curricular_units where published),
    'sequences',(select count(*) from facodi.learning_objects where published and object_type='playlist'),
    'pending_suggestions',(select count(*) from facodi.resource_suggestions where status='pending'),
    'candidates',(select count(*) from facodi.curricular_units u join facodi.courses c on c.id=u.course_id where u.published and c.published and not exists(select 1 from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=u.learning_object_id and r.relation_type='contains' and o.object_type='playlist' and o.published) and not exists(select 1 from facodi.unit_videos v where v.curricular_unit_id=u.id))
  ) into metrics;
  select status into result_status from extensions.http_post(target, metrics::text, 'application/json');
  if result_status < 200 or result_status >= 300 then raise exception 'KF webhook HTTP status %',result_status; end if;
  return result_status;
exception when others then
  raise exception 'KF snapshot delivery failed; inspect the Odoo automation and network configuration';
end;
$$;
revoke all on function facodi.kf_push_operational_snapshot() from public, anon, authenticated, service_role;

