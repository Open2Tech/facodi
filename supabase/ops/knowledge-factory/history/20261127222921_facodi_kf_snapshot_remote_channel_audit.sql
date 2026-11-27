do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
if position('kf_remote_audit' in s)>0 then raise exception 'Already configured'; end if;
s:=replace(s,'''schema_version'',1,','''schema_version'',1,
 ''kf_remote_audit'',coalesce((select result||jsonb_build_object(''age_hours'',greatest(0,floor(extract(epoch from (clock_timestamp()-observed_at))/3600)::int)) from facodi.kf_mirror_remote_audit order by audit_day desc limit 1),jsonb_build_object(''reason'',''not_run'',''age_hours'',0)),');
if position('kf_remote_audit' in s)=0 then raise exception 'Unexpected snapshot'; end if; execute s; end $m$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
