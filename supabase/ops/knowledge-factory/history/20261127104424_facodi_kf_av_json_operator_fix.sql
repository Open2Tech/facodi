do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb)'::regprocedure) into s;
s:=replace(s,'(result_payload->''kf_av_async''-''lease_token'')','((result_payload->''kf_av_async'')-''lease_token''::text)');
if position('lease_token''::text' in s)=0 then raise exception 'Unexpected finish definition'; end if; execute s;
select pg_get_functiondef('facodi.kf_claim_private_av_v2()'::regprocedure) into s;
s:=replace(s,'(result_payload->''kf_av_async''-''lease_token'')','((result_payload->''kf_av_async'')-''lease_token''::text)');
if position('lease_token''::text' in s)=0 then raise exception 'Unexpected claim definition'; end if; execute s;
end $m$;
