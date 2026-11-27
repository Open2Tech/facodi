do $migration$
declare definition text;
  marker text := $needle$   order by o.metadata->>'kf_reference_last_checked'$needle$;
begin
  select pg_get_functiondef('facodi.kf_publish_approved_youtube_references()'::regprocedure) into definition;
  if position(marker in definition)=0 or position('pg_input_is_valid' in definition)>0 then
    raise exception 'Unexpected reference publisher definition';
  end if;
  definition:=replace(definition, marker, $replace$   and case when pg_input_is_valid(o.metadata->>'kf_reference_last_checked','timestamp with time zone')
     then (o.metadata->>'kf_reference_last_checked')::timestamptz <= now()-interval '6 hours'
     else true end
   order by o.metadata->>'kf_reference_last_checked'$replace$);
  definition:=replace(definition,'   info:=null;', $timeout$   if not extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','4000') then
     raise exception 'Unable to bound reference source request';
   end if;
   info:=null;$timeout$);
  definition:=replace(definition,' return n;', $reset$ perform extensions.http_reset_curlopt();
 return n;
exception when others then
 perform extensions.http_reset_curlopt();
 raise;$reset$);
  if position('CURLOPT_TIMEOUT_MS' in definition)=0 or position('http_reset_curlopt' in definition)=0 then
    raise exception 'Unexpected source check transport';
  end if;
  execute definition;
end
$migration$;
