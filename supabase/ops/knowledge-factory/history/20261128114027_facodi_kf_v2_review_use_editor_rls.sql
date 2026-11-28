do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text)'::regprocedure) into s;
if position('not exists(select 1 from auth.users where id=p_actor and raw_app_meta_data->>''role'' in (''editor'',''admin''))' in s)=0 then raise exception 'Unexpected review definition'; end if;
s:=replace(s,'not exists(select 1 from auth.users where id=p_actor and raw_app_meta_data->>''role'' in (''editor'',''admin''))','p_actor is distinct from auth.uid() or not facodi.is_facodi_editor()');
execute s; end $m$;
revoke all on function facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text) to authenticated;
