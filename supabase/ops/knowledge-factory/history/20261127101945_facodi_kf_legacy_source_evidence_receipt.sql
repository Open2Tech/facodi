create or replace function facodi.kf_legacy_source_receipt_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare items jsonb; rid uuid; n integer; valid integer; existing jsonb; expected text[]:=array['0x0GlvW4hro','ZIkdmLJ_z2A','muVSHd-4WfI','o7BCi3UELao','r8fqGIGYFXA'];
begin
select count(*),count(*) filter(where o.object_type='video' and o.language='pt' and o.status='draft' and not o.published and o.source_id=any(expected) and o.source_url='https://www.youtube.com/watch?v='||o.source_id and o.metadata->'kf_source_evidence_v1'->>'title_match'='true' and o.metadata->'kf_source_evidence_v1'->>'status'='200' and o.metadata->'kf_source_evidence_v1'->>'title'=o.title and o.metadata->'kf_source_evidence_v1'->>'author_url'='https://www.youtube.com/@LCMAquino' and o.metadata->'kf_source_evidence_v1'->>'scope'='public_oembed_metadata_only' and (select count(*) from facodi.learning_objects x where x.source_id=o.source_id or x.source_url=o.source_url)=1 and not exists(select 1 from facodi.youtube_videos y where (y.youtube_video_id=o.source_id or y.canonical_url=o.source_url) and y.learning_object_id is distinct from o.id)),
jsonb_agg(jsonb_build_object('object_id',o.id,'video_id',o.source_id,'title',o.title,'source_url',o.source_url,'language',o.language,'source_evidence',o.metadata->'kf_source_evidence_v1') order by o.source_id)
into n,valid,items from facodi.learning_objects o where o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127';
if n<>5 or valid<>5 or (select count(distinct x->>'video_id') from jsonb_array_elements(items) x)<>5 then return jsonb_build_object('ok',false,'reason','source_or_metadata_gate'); end if;
insert into facodi.kf_bridge_receipts(source_task_id,event_key,status,payload) values(125,'supabase:facodi:legacy-source-evidence-v1:125','received',jsonb_build_object('contract','resource_source_evidence.v1','source','supabase_oembed_verified','items',items,'editorial_decision','pending','gates',jsonb_build_array('source_identity','minimum_metadata'),'license_verified',false,'content_reviewed',false)) on conflict(event_key) do nothing;
select id,payload into rid,existing from facodi.kf_bridge_receipts where event_key='supabase:facodi:legacy-source-evidence-v1:125' and source_task_id=125 and status='received';
if rid is null or existing->'items' is distinct from items then return jsonb_build_object('ok',false,'reason','receipt_conflict_or_changed_evidence'); end if;
return jsonb_build_object('ok',true,'contract','resource_source_evidence.v1','task_id',125,'receipt_id',rid,'video_ids',to_jsonb(expected),'count',5,'gates',jsonb_build_array('source_identity','minimum_metadata'));
end $$;
revoke all on function facodi.kf_legacy_source_receipt_v1() from public,anon,authenticated,service_role;
