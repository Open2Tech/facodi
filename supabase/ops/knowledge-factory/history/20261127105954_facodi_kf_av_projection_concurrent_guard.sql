do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_project_private_av_evidence_v2()'::regprocedure) into s;
if position('from eligible e where v.id=e.classification_id;' in s)=0 then raise exception 'Unexpected projection definition'; end if;
s:=replace(s,'from eligible e where v.id=e.classification_id;','from eligible e where v.id=e.classification_id and v.status=''needs_review'' and v.needs_review and not (v.metadata ? ''kf_av_evidence_job_id'');');
execute s;
end $m$;
revoke all on function facodi.kf_project_private_av_evidence_v2() from public,anon,authenticated,service_role;
