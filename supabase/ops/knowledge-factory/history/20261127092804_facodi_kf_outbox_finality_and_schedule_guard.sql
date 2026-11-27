do $migration$
declare s text;
begin
 select pg_get_functiondef('facodi.kf_pull_odoo_outbox_v1()'::regprocedure) into s;
 s:=replace(s,'''domain'',jsonb_build_array(jsonb_build_array(''project_id''','''domain'',jsonb_build_array(jsonb_build_array(''id'',''not in'',coalesce((select jsonb_agg(distinct source_task_id) from facodi.kf_bridge_receipts),''[]''::jsonb)),jsonb_build_array(''project_id''');
 s:=replace(s,'if jsonb_array_length(notes)=0 then continue; end if;','if jsonb_array_length(notes)=0 then continue; end if;
   if t->''stage_id''->>0 <> ''21'' and (not exists(select 1 from jsonb_array_elements(notes) x where x->>''subject'' in (''KF-CHECKPOINT-DRAFT-v1'',''KF-COURSE-LESSON-DRAFT-v1'')) or not exists(select 1 from jsonb_array_elements(notes) x where x->>''subject'' in (''KF-CHECKPOINT-QA-v1'',''KF-COURSE-LESSON-QA-v1''))) then continue; end if;');
 s:=replace(s,'''editorial_decision'',''pending''),''received'')','''editorial_decision'',case when t->''stage_id''->>0=''21'' then ''reject'' else ''pending'' end),case when t->''stage_id''->>0=''21'' then ''rejected'' else ''received'' end)');
 if position('not in'',coalesce' in s)=0 or position('then ''rejected'' else ''received'' end' in s)=0 then raise exception 'Unexpected outbox definition'; end if;
 execute s;
end $migration$;
revoke all on function facodi.kf_pull_odoo_outbox_v1() from public,anon,authenticated,service_role;
create or replace function facodi.kf_run_outbox_sync_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;
begin
 r:=facodi.kf_pull_odoo_outbox_v1();
 if r->>'ok' is distinct from 'true' then raise exception 'KF outbox sync failed: %',coalesce(r->>'reason','unknown'); end if;
 return r;
end $$;
revoke all on function facodi.kf_run_outbox_sync_v1() from public,anon,authenticated,service_role;
