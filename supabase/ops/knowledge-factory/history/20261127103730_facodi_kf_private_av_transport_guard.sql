do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_run_private_av_review_v1()'::regprocedure) into s;
s:=replace(s,'select a.id,a.video_id,a.learning_object_id,o.title,o.source_url,u.id unit_id,u.course_id into j','if (select count(*) from (select result_payload->''kf_av_review''->>''outcome'' outcome from facodi.analysis_jobs where request_source=''kf_private_candidate_review_v1'' and result_payload ? ''kf_av_review'' order by result_payload->''kf_av_review''->>''checked_at'' desc limit 2) recent where outcome in (''request_failed'',''transport_or_response_error''))>=2 then return jsonb_build_object(''ok'',false,''reason'',''circuit_open''); end if;
 select a.id,a.video_id,a.learning_object_id,o.title,o.source_url,u.id unit_id,u.course_id into j');
s:=replace(s,'perform set_config(''http.curlopt_timeout_msec'',''25000'',true);','if not extensions.http_set_curlopt(''CURLOPT_TIMEOUT_MS'',''65000'') then raise exception ''HTTP timeout setting rejected''; end if;');
s:=replace(s,'if r.status=200 and length(r.content)<=60000 then','perform extensions.http_reset_curlopt();
 if r.status=200 and length(r.content)<=60000 then');
s:=replace(s,'safe_result:=jsonb_build_object(''outcome'',''transport_or_response_error'');','perform extensions.http_reset_curlopt();
 safe_result:=jsonb_build_object(''outcome'',''transport_or_response_error'',''sqlstate'',SQLSTATE);');
s:=replace(s,'''checked_at'',now()','''checked_at'',clock_timestamp()');
if position('circuit_open' in s)=0 or position('CURLOPT_TIMEOUT_MS' in s)=0 or position('SQLSTATE' in s)=0 then raise exception 'Unexpected AV function definition'; end if; execute s;
end $m$;
revoke all on function facodi.kf_run_private_av_review_v1() from public,anon,authenticated,service_role;
