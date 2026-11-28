create or replace function facodi.kf_production_metrics_v1() returns jsonb language sql stable security invoker set search_path='' as $$
with jobs as materialized (
 select j.*,case when request_source='resource_suggestion' then result_payload->'usage' when request_source='kf_private_candidate_review_v1' then result_payload->'kf_av_async'->'usage' else null end usage_sample
 from facodi.analysis_jobs j
), measured as (
 select request_source,job_type,count(*) total_jobs,count(*) filter(where status='succeeded') succeeded,count(*) filter(where status='needs_review') needs_review,count(*) filter(where status='failed') failed,count(*) filter(where status in ('queued','running','retrying')) pending,
 count(*) filter(where usage_sample->>'input_tokens' ~ '^[0-9]{1,12}$' and usage_sample->>'output_tokens' ~ '^[0-9]{1,12}$') measured_jobs,
 sum(case when usage_sample->>'input_tokens' ~ '^[0-9]{1,12}$' and usage_sample->>'output_tokens' ~ '^[0-9]{1,12}$' then (usage_sample->>'input_tokens')::bigint end) input_tokens,
 sum(case when usage_sample->>'input_tokens' ~ '^[0-9]{1,12}$' and usage_sample->>'output_tokens' ~ '^[0-9]{1,12}$' then (usage_sample->>'output_tokens')::bigint end) output_tokens
 from jobs group by request_source,job_type
), demand as (
 select signal_type,route,count(*) filter(where resolved_at is null) open,count(*) filter(where resolved_at is not null) resolved from facodi.kf_production_demands group by 1,2
), delivery as (
 select count(*) receipts,count(*) filter(where r.status='applied' and r.payload->>'current_plan_matches'='true') reconciled,
 count(*) filter(where r.status='applied' and r.payload->>'current_plan_matches'='true' and d.first_seen_at<=r.created_at) lead_time_samples,
 round(avg(extract(epoch from r.created_at-d.first_seen_at)) filter(where r.status='applied' and r.payload->>'current_plan_matches'='true' and d.first_seen_at<=r.created_at)) avg_seconds_signal_to_receipt
 from facodi.kf_bridge_receipts r left join facodi.kf_production_demands d on d.signal_type='curricular_gap' and d.subject_id::text=r.payload->>'unit_id'
 where r.payload->>'contract'='diagnosis_delivery.v1'
), receipts as (
 select coalesce(payload->>'contract','legacy_untyped') contract,status,count(*) records from facodi.kf_bridge_receipts group by 1,2
)
select jsonb_build_object('observed_at',now(),'scope','recorded_operational_metrics_not_billing','job_usage',coalesce((select jsonb_agg(to_jsonb(m) order by request_source,job_type) from measured m),'[]'::jsonb),'demand',coalesce((select jsonb_agg(to_jsonb(d) order by signal_type,route) from demand d),'[]'::jsonb),'diagnosis_delivery',(select to_jsonb(d) from delivery d),'receipts',coalesce((select jsonb_agg(to_jsonb(r) order by contract,status) from receipts r),'[]'::jsonb),'limitations',jsonb_build_array('Tokens recorded only; missing provider calls and retries not inferred','No currency costs or actual work centre capacity measured','Receipt lead time includes queue and reconciliation, not actual worker time','Receipt approval is not first-pass yield or learner success'))
$$;
revoke all on function facodi.kf_production_metrics_v1() from public,anon,authenticated,service_role;
do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_audit_odoo_slides_v1(integer)'::regprocedure) into s;
if position('a.observed_at<now()-interval ''7 days''' in s)=0 then raise exception 'Unexpected audit scheduling predicate';end if;
s:=replace(s,'a.observed_at<now()-interval ''7 days''','a.observed_at<now()-case when a.outcome in (''missing'',''mismatch'') then interval ''1 day'' else interval ''7 days'' end');
execute s;
select pg_get_functiondef('facodi.kf_mirror_slide_audit_health_v1()'::regprocedure) into s;
s:=replace(s,'when a.observed_at<now()-interval ''7 days'' then ''stale''','when a.outcome=''matched'' and a.observed_at<now()-interval ''7 days'' then ''stale''');
execute s;
end $m$;
