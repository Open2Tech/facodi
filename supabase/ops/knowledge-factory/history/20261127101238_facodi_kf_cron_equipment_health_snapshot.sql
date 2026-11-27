do $m$ declare s text; begin
 select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
 s:=replace(s,'''schema_version'',1,','''schema_version'',1,
 ''kf_cron_health'',(select coalesce(jsonb_agg(jsonb_build_object(''name'',j.jobname,''active'',j.active,''status'',coalesce(h.latest,''unknown''),''failures'',coalesce(h.failures,0)) order by j.jobname),''[]''::jsonb) from cron.job j left join lateral (select (array_agg(z.status order by z.start_time desc))[1] latest,count(*) filter(where z.status=''failed'') failures from (select d.status,d.start_time from cron.job_run_details d where d.jobid=j.jobid and d.status in (''failed'',''succeeded'') order by d.start_time desc limit 3) z) h on true where j.jobname like ''facodi-kf-%''),');
 if position('kf_cron_health' in s)=0 then raise exception 'Unexpected snapshot definition'; end if;
 execute s;
 end $m$;
 revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
