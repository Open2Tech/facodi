do $migration$
declare s text;
begin
 select pg_get_functiondef('facodi.kf_odoo_elearning_sync_v1(integer)'::regprocedure) into s;
 s:=replace(s,'where s.external_id is null or not s.active or s.content_hash is distinct from','where s.external_id is null or not s.active or s.synced_at < now()-interval ''7 days'' or s.content_hash is distinct from');
 s:=replace(s,'order by d.priority,d.channel_key,d.seq,d.external_id limit lim','order by case when d.channel_key=(select ''__import__.facodi_mirror_course_''||replace(c.learning_object_id::text,''-'','''') from facodi.courses c where c.slug=''lesti'' and c.published limit 1) then 2 else d.priority end,d.channel_key,d.seq,d.external_id limit lim');
 if position('7 days' in s)=0 or position('c.slug=''lesti''' in s)=0 then raise exception 'Unexpected mirror function'; end if;
 execute s;
end $migration$;
create or replace function facodi.kf_run_odoo_elearning_sync_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;
begin
 r:=facodi.kf_odoo_elearning_sync_v1(50);
 if r->>'ok' is distinct from 'true' then raise exception 'Mirror sync failed in phase %: %',r->>'phase',r->>'reason'; end if;
 return r;
end $$;
revoke all on function facodi.kf_run_odoo_elearning_sync_v1() from public,anon,authenticated,service_role;
