create or replace function facodi.kf_run_diagnosis_delivery_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;
begin
 r:=facodi.kf_pull_diagnosis_delivery_v1();
 if r->>'ok' is distinct from 'true' then raise exception 'KF diagnosis outbox failed: %',coalesce(r->>'reason','unknown'); end if;
 return r;
end $$;
revoke all on function facodi.kf_run_diagnosis_delivery_v1() from public,anon,authenticated,service_role;
do $m$ declare s text; begin
 select pg_get_functiondef('facodi.kf_demand_plan_v1()'::regprocedure) into s;
 if position('length(title) between 1 and 250' in s)=0 then raise exception 'Unexpected demand plan'; end if;
 s:=replace(s,'length(title) between 1 and 250','length(title) between 1 and 250 and title !~ ''[<>]''');
 execute s;
end $m$;
do $m$ declare s text; begin
 select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
 if position('pg_advisory_xact_lock(hashtextextended(''facodi.kf_push_operational_snapshot'',0))' in s)>0 then raise exception 'Lock already configured'; end if;
 if position(E'begin\n' in s)=0 then raise exception 'Unexpected snapshot'; end if;
 s:=overlay(s placing E'begin\n  perform pg_advisory_xact_lock(hashtextextended(''facodi.kf_push_operational_snapshot'',0));\n' from position(E'begin\n' in s) for 6);
 execute s;
end $m$;
