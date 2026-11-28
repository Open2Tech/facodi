do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_audit_odoo_slides_v1(integer)'::regprocedure) into s;
if position('case when a.external_id is null or a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash then 0 else 1 end' in s)=0 then raise exception 'Unexpected audit definition'; end if;
s:=replace(s,'case when a.external_id is null or a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash then 0 else 1 end','case when a.external_id is not null and (a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash) then 0 when a.external_id is null then 1 else 2 end');execute s;end $m$;
select cron.alter_job(16,schedule:='13,23,33 4 * * *',command:='select facodi.kf_run_remote_channel_audit_v2();');
select cron.schedule('facodi-kf-remote-slide-audit','3,13,23,33,43,53 * * * *','select facodi.kf_run_slide_audit_v1();');
