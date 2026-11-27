do $migration$
declare s text;
begin
 select pg_get_functiondef('facodi.kf_odoo_elearning_sync_v1(integer)'::regprocedure) into s;
 s:=replace(s,'["id","channel_id/id","name","sequence","slide_category","html_content","is_published","active"]','["id","channel_id/id","name","sequence","slide_category","html_content","is_published","active","is_preview"]');
 s:=replace(s,'''article'',x->>''html_content'',''True'',''True'')','''article'',x->>''html_content'',''True'',''True'',''True'')');
 s:=replace(s,'jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content)','jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content,''public-preview-v1'')');
 if position('is_preview' in s)=0 or position('public-preview-v1' in s)=0 then raise exception 'Unexpected mirror definition'; end if;
 execute s;
end $migration$;
revoke all on function facodi.kf_odoo_elearning_sync_v1(integer) from public,anon,authenticated,service_role;
