do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_record_curation_assessment_v1(uuid,uuid,text,text,jsonb)'::regprocedure) into s;
if position('{1,1000}' in s)=0 then raise exception 'Unexpected source guard';end if;
s:=replace(s,'x#>>''{}'' !~ ''^https://[^[:space:]<>"]{1,1000}$''','length(x#>>''{}'')>1008 or x#>>''{}'' !~ ''^https://[^[:space:]<>"]+$''');execute s;end $m$;
