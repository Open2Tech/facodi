alter table facodi.kf_mirror_slide_audit add column expected_channel_id integer;
-- Older observations did not persist the observed channel ID. Do not infer it from today's ledger.
do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_audit_odoo_slides_v1(integer)'::regprocedure) into s;
if position('a.expected_hash is distinct from s.content_hash' in s)=0 or position('insert into facodi.kf_mirror_slide_audit(external_id,remote_id,expected_hash,observed_at,outcome,differences)' in s)=0 then raise exception 'Unexpected audit definition'; end if;
s:=replace(s,'a.expected_hash is distinct from s.content_hash','a.expected_hash is distinct from s.content_hash or a.expected_channel_id is distinct from c.remote_id');
s:=replace(s,'insert into facodi.kf_mirror_slide_audit(external_id,remote_id,expected_hash,observed_at,outcome,differences)','insert into facodi.kf_mirror_slide_audit(external_id,remote_id,expected_hash,expected_channel_id,observed_at,outcome,differences)');
s:=replace(s,'e->>''expected_hash'',clock_timestamp()','e->>''expected_hash'',(e->>''channel_id'')::int,clock_timestamp()');
s:=replace(s,'expected_hash=excluded.expected_hash,observed_at','expected_hash=excluded.expected_hash,expected_channel_id=excluded.expected_channel_id,observed_at');
execute s;
select pg_get_functiondef('facodi.kf_mirror_slide_audit_health_v1()'::regprocedure) into s;
if position('a.expected_hash is distinct from s.content_hash' in s)=0 or position('left join facodi.kf_mirror_slide_audit a' in s)=0 then raise exception 'Unexpected health definition'; end if;
s:=replace(s,'left join facodi.kf_mirror_slide_audit a','left join facodi.kf_odoo_mirror_state c on c.external_id=d.channel_key and c.model=''slide.channel'' and c.active and c.released and c.remote_id>0 left join facodi.kf_mirror_slide_audit a');
s:=replace(s,'case when s.external_id is null','case when c.external_id is null or s.external_id is null or s.model<>''slide.slide'' or coalesce(s.remote_id,0)<=0');
s:=replace(s,'a.expected_hash is distinct from s.content_hash','a.expected_hash is distinct from s.content_hash or a.expected_channel_id is distinct from c.remote_id');
execute s;
select pg_get_functiondef('facodi.kf_production_metrics_v1()'::regprocedure) into s;
if position('then result_payload->''kf_av_async''->''usage'' else null end usage_sample' in s)=0 then raise exception 'Unexpected usage definition';end if;
s:=replace(s,'then result_payload->''kf_av_async''->''usage'' else null end usage_sample','then coalesce(nullif(result_payload->''kf_av_async''->''usage'',''null''::jsonb),nullif(result_payload->''kf_av_review''->''usage'',''null''::jsonb)) else null end usage_sample');
execute s;
end $m$;
