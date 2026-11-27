do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
if position('''release_editions''' in s)=0 then
s:=replace(s,'declare target text; metrics jsonb; result_status integer;','declare target text; metrics jsonb; result_status integer; reconciliation jsonb;');
s:=replace(s,'  select jsonb_build_object(','  reconciliation:=facodi.kf_release_reconciliation_v1();
  select jsonb_build_object(');
s:=replace(s,'''schema_version'',1,','''schema_version'',1,
''release_editions'',jsonb_array_length(reconciliation),
''release_structure_ok'',(select count(*) from jsonb_array_elements(reconciliation) e where e->>''structure_ok''=''true'' and e->>''approved_links''=e->>''expected''),
''release_mirror_ok'',(select count(*) from jsonb_array_elements(reconciliation) e where e->>''mirror_released''=''true'' and e->>''mirrored''=e->>''expected''),
''release_receipts_ok'',(select count(*) from jsonb_array_elements(reconciliation) e where (e->>''applied_receipts'')::integer>=case when e->>''product''=''001'' then 2 else 3 end),');
if position('reconciliation:=' in s)=0 or position('''release_editions''' in s)=0 then raise exception 'Unexpected snapshot definition'; end if;
execute s; end if; end $m$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
