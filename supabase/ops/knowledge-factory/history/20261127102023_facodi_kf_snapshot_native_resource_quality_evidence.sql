do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
s:=replace(s,'''schema_version'',1,','''schema_version'',1,
 ''kf_resource_evidence'',facodi.kf_legacy_source_receipt_v1(),');
if position('kf_resource_evidence' in s)=0 then raise exception 'Unexpected snapshot'; end if; execute s; end $m$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
