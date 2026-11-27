create or replace function facodi.kf_mrp_resource_av_assurance_v1()
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  with manifests as materialized (
    select (x->>'task_id')::integer as task_id,
           (x->>'receipt_id')::uuid as receipt_id,
           (x->>'count')::integer as expected,
           x->>'evidence_hash' as evidence_hash
    from jsonb_array_elements(facodi.kf_mrp_source_evidence_v1()) x
  ),
  batches as (
    select m.*,
           coalesce(jsonb_agg(evidence.job_id order by evidence.job_id)
                    filter (where evidence.job_id is not null), '[]'::jsonb) as job_ids
    from manifests m
    join facodi.kf_bridge_receipts r on r.id = m.receipt_id
    cross join lateral jsonb_array_elements(r.payload->'items') as item
    left join lateral (
      select j.id as job_id
      from facodi.learning_objects o
      join facodi.youtube_videos y on y.learning_object_id = o.id and y.youtube_video_id = item->>'video_id'
      join facodi.analysis_jobs j on j.learning_object_id = o.id and j.video_id = y.id
      join facodi.video_classifications v on v.video_id = y.id
        and v.metadata->>'kf_av_evidence_job_id' = j.id::text
        and v.curricular_unit_id::text = o.metadata->'kf_curricular_candidate_v1'->>'unit_id'
      where o.id::text = item->>'object_id'
        and y.status = 'pending'
        and j.request_source = 'kf_private_candidate_review_v1'
        and j.status = 'needs_review'
        and j.result_payload->'kf_av_async'->>'outcome' = 'partial_av_evidence'
        and j.result_payload->'kf_av_async'->>'publication_authorized' = 'false'
        and v.status = 'needs_review' and v.needs_review
        and v.metadata->>'kf_av_consensus' = 'cross_provider_strong_match'
        and v.metadata->>'publication_authorized' = 'false'
      order by j.id
      limit 1
    ) evidence on true
    group by m.task_id, m.receipt_id, m.expected, m.evidence_hash
  )
  select coalesce(jsonb_agg(to_jsonb(b) || jsonb_build_object('scope', 'partial_av_cross_provider')
                           order by b.task_id, b.receipt_id), '[]'::jsonb)
  from batches b;
$$;

revoke all on function facodi.kf_mrp_resource_av_assurance_v1() from public, anon, authenticated, service_role;

do $migration$
declare
  snapshot_sql text;
  marker text := $marker$'kf_assurance_v1',jsonb_build_object('mirror',facodi.kf_mirror_health_v1(),$marker$;
begin
  select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure)
    into snapshot_sql;
  if position(marker in snapshot_sql) = 0
     or position('resource_av_batches' in snapshot_sql) > 0 then
    raise exception 'Unexpected KF assurance snapshot definition';
  end if;
  execute replace(snapshot_sql, marker,
    marker || $entry$'resource_av_batches',facodi.kf_mrp_resource_av_assurance_v1(),$entry$);
end
$migration$;

revoke all on function facodi.kf_push_operational_snapshot() from public, anon, authenticated, service_role;
