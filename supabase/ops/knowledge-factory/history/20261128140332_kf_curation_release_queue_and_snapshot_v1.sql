create or replace function facodi.kf_curation_release_receipts_v1()
returns jsonb language sql stable security invoker set search_path='' as $$
select coalesce(jsonb_agg(to_jsonb(q) order by q.mission_id,q.receipt_id),'[]'::jsonb)
from (
 select r.id receipt_id,r.source_task_id mission_id,r.payload->>'manifest_digest' manifest_digest,r.payload->>'candidate_digest' candidate_digest,r.payload->>'unit_id' unit_id,r.payload->>'resource_id' resource_id,r.payload->>'job_id' job_id,r.payload->'review'->>'odoo_order_id' order_id,r.payload->'review'->'passed_qc_ids' passed_qc_ids,r.payload->>'relation_id' relation_id,r.payload->>'unit_video_id' unit_video_id,'curation_association.v1'::text contract
 from facodi.kf_bridge_receipts r
 join facodi.kf_release_authorizations a on a.receipt_id=r.id and a.revoked_at is null and a.payload_hash=encode(sha256(convert_to((r.payload-array['relation_id','unit_video_id','applied_at','release_channel'])::text,'UTF8')),'hex')
 join facodi.curricular_units u on u.id::text=r.payload->>'unit_id' and u.published and u.status='active'
 join facodi.courses c on c.id=u.course_id and c.published and c.status='active'
 join facodi.learning_objects p on p.id=u.learning_object_id and p.published and p.status='active'
 join facodi.learning_object_relations l on l.id::text=r.payload->>'relation_id' and l.parent_object_id=p.id and l.child_object_id::text=r.payload->>'resource_id' and l.relation_type='contains' and l.created_by_mechanism='kf_curation_release_v1' and l.metadata->>'review_status'='approved' and l.metadata->>'kf_release_receipt_id'=r.id::text
 join facodi.learning_objects o on o.id=l.child_object_id and o.published and o.status='active' and o.object_type='video'
 join facodi.unit_videos v on v.id::text=r.payload->>'unit_video_id' and v.curricular_unit_id=u.id and v.metadata->>'review_status'='approved' and v.metadata->>'kf_release_receipt_id'=r.id::text
 join public.videos y on y.id=v.video_id and y.youtube_id=o.source_id
 where r.status='applied' and r.payload->>'contract'='curation_association.v1' and r.payload->>'release_channel'='scheduled_editorial_admin'
 order by r.created_at desc,r.id limit 100
) q;
$$;
revoke all on function facodi.kf_curation_release_receipts_v1() from public,anon,authenticated,service_role;
grant execute on function facodi.kf_curation_release_receipts_v1() to postgres;
CREATE OR REPLACE FUNCTION facodi.kf_run_approved_release_queue_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r facodi.kf_bridge_receipts%rowtype; result jsonb;
begin
 if not pg_try_advisory_xact_lock(391726,1) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select * into r from facodi.kf_bridge_receipts where status='reviewed' and payload->>'contract'='checkpoint_question.v1' and payload->>'decision'='pass' and payload->>'editorial_decision'='pass' and payload->>'release_mode'='scheduled' and payload->>'release_authorization'='editorial_admin' and exists(select 1 from facodi.kf_release_authorizations a where a.receipt_id=kf_bridge_receipts.id and a.revoked_at is null and a.expires_at>now() and a.payload_hash=encode(sha256(convert_to(kf_bridge_receipts.payload::text,'UTF8')),'hex')) order by created_at,id for update skip locked limit 1;
 if not found then return facodi.kf_run_approved_curation_release_v1(); end if;
 result:=facodi.kf_release_checkpoint_question_v1(r.id,true);
 if not coalesce((result->>'ok')::boolean,false) then
   update facodi.kf_bridge_receipts set status='rejected',payload=payload||jsonb_build_object('release_failure',result,'release_failed_at',now()) where id=r.id;
   return result;
 end if;
 result:=facodi.kf_release_checkpoint_question_v1(r.id,false);
 if coalesce((result->>'applied')::boolean,false) then
   update facodi.kf_bridge_receipts set payload=payload||jsonb_build_object('release_channel','scheduled_editorial_admin') where id=r.id;
 elsif not coalesce((result->>'ok')::boolean,false) then
   update facodi.kf_bridge_receipts set status='rejected',payload=payload||jsonb_build_object('release_failure',result,'release_failed_at',now()) where id=r.id;
 end if;
 return result;
end $function$
;
CREATE OR REPLACE FUNCTION facodi.kf_push_operational_snapshot()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare target text; metrics jsonb; result_status integer; reconciliation jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('facodi.kf_push_operational_snapshot',0));
  select decrypted_secret into target from vault.decrypted_secrets where name='facodi_kf_snapshot_webhook';
  if target is null or target !~ '^https://edu-facodi[.]odoo[.]com/web/hook/[A-Za-z0-9_-]+$' then raise exception 'KF webhook not configured'; end if;
  reconciliation:=facodi.kf_release_reconciliation_v1();
  select jsonb_build_object(
    'schema_version',1,
 'kf_demand_plan',facodi.kf_demand_plan_v1(), 'kf_curation_manifest',facodi.kf_curation_manufacturing_manifest_v1(), 'kf_curation_release_receipts',facodi.kf_curation_release_receipts_v1(),
 'kf_remote_audit',coalesce((select result||jsonb_build_object('age_hours',greatest(0,floor(extract(epoch from (clock_timestamp()-observed_at))/3600)::int)) from facodi.kf_mirror_remote_audit order by audit_day desc limit 1),jsonb_build_object('reason','not_run','age_hours',0)),
 'kf_assurance_v1',jsonb_build_object('mirror',facodi.kf_mirror_health_v1(),'resource_av_batches',facodi.kf_mrp_resource_av_assurance_v1(),'resource_av',jsonb_build_object('task_id',125,'expected',5,'scope','partial_av_cross_provider','job_ids',(select coalesce(jsonb_agg(distinct a.id::text),'[]'::jsonb) from facodi.analysis_jobs a join facodi.video_classifications v on v.video_id=a.video_id and v.metadata->>'kf_av_evidence_job_id'=a.id::text join facodi.learning_objects o on o.id=a.learning_object_id where a.request_source='kf_private_candidate_review_v1' and a.status='needs_review' and a.result_payload->'kf_av_async'->>'outcome'='partial_av_evidence' and v.metadata->>'kf_av_consensus'='cross_provider_strong_match' and v.status='needs_review' and v.needs_review and o.status='draft' and not o.published and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127'))),
 'kf_av_health',(select jsonb_build_object('total',count(*),'running',count(*) filter(where outcome='running'),'partial',count(*) filter(where outcome='partial_av_evidence'),'metadata_only',count(*) filter(where outcome='metadata_only_or_no_av'),'failed',count(*) filter(where outcome not in ('running','partial_av_evidence','metadata_only_or_no_av','not_attempted')),'not_attempted',count(*) filter(where outcome='not_attempted')) from (select case when result_payload->'kf_av_async'->>'outcome'='running' and (result_payload->'kf_av_async'->>'expires_at')::timestamptz<now() then 'expired' else coalesce(result_payload->'kf_av_async'->>'outcome',result_payload->'kf_av_review'->>'outcome','not_attempted') end outcome from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1') av),
 'kf_mrp_source_evidence',facodi.kf_mrp_source_evidence_v1(),
'release_editions',jsonb_array_length(reconciliation),
'release_structure_ok',(select count(*) from jsonb_array_elements(reconciliation) e where e->>'structure_ok'='true' and e->>'approved_links'=e->>'expected'),
'release_mirror_ok',(select count(*) from jsonb_array_elements(reconciliation) e where e->>'mirror_released'='true' and e->>'mirrored'=e->>'expected'),
'release_receipts_ok',(select count(*) from jsonb_array_elements(reconciliation) e where (e->>'applied_receipts')::integer>=case when e->>'product'='001' then 2 else 3 end),
 'kf_cron_health',(select coalesce(jsonb_agg(jsonb_build_object('name',j.jobname,'active',j.active,'status',coalesce(h.latest,'unknown'),'failures',coalesce(h.failures,0)) order by j.jobname),'[]'::jsonb) from cron.job j left join lateral (select (array_agg(z.status order by z.start_time desc))[1] latest,count(*) filter(where z.status='failed') failures from (select d.status,d.start_time from cron.job_run_details d where d.jobid=j.jobid and d.status in ('failed','succeeded') order by d.start_time desc limit 3) z) h on true where j.jobname like 'facodi-kf-%'),
 'curation_modality',(select count(*) from facodi.kf_curricular_triage_v1 where route='modality_review'),
 'curation_discovery',(select count(*) from facodi.kf_curricular_triage_v1 where route='resource_discovery'),
 'curation_existing_relations',(select count(*) from facodi.kf_curricular_triage_v1 where public_direct_relations>0),
 'curation_units_with_candidates',(select count(distinct unit_id) from facodi.kf_resource_candidates_v1 where candidate_rank<=5),
 'curation_candidates',(select count(*) from facodi.kf_resource_candidates_v1 where candidate_rank<=5),
    'mirror_channels',(select count(*) from facodi.kf_odoo_mirror_channels_v1),
    'mirror_channels_published',(select count(*) from facodi.kf_odoo_mirror_channels_v1 d join facodi.kf_odoo_mirror_state m on m.external_id=d.external_id and m.active and m.released),
    'mirror_slides_expected',(select count(*) from facodi.kf_odoo_mirror_slides_v1),
    'mirror_slides_synced',(select count(*) from facodi.kf_odoo_mirror_slides_v1 d join facodi.kf_odoo_mirror_state m on m.external_id=d.external_id and m.active),
    'receipts_received',(select count(*) from facodi.kf_bridge_receipts where status='received'),
    'receipts_reviewed',(select count(*) from facodi.kf_bridge_receipts where status='reviewed'),
    'receipts_applied',(select count(*) from facodi.kf_bridge_receipts where status='applied'),
    'receipts_rejected',(select count(*) from facodi.kf_bridge_receipts where status='rejected'),
    'drafts_assembled',(select count(*) from facodi.kf_bridge_receipts where payload->>'assembly_state'='draft_assembled'),
    'published_objects',(select count(*) from facodi.learning_objects where published),
    'courses',(select count(*) from facodi.courses where published),
    'units',(select count(*) from facodi.curricular_units where published),
    'sequences',(select count(*) from facodi.learning_objects where published and object_type='playlist'),
    'pending_suggestions',(select count(*) from facodi.resource_suggestions where status='pending'),
    'candidates',(select count(*) from facodi.curricular_units u join facodi.courses c on c.id=u.course_id where u.published and c.published and not exists(select 1 from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=u.learning_object_id and r.relation_type='contains' and o.object_type='playlist' and o.published) and not exists(select 1 from facodi.unit_videos v where v.curricular_unit_id=u.id))
  ) into metrics;
  select status into result_status from extensions.http_post(target, metrics::text, 'application/json');
  if result_status < 200 or result_status >= 300 then raise exception 'KF webhook HTTP status %',result_status; end if;
  return result_status;
exception when others then
  raise exception 'KF snapshot delivery failed; inspect the Odoo automation and network configuration';
end;
$function$
;

