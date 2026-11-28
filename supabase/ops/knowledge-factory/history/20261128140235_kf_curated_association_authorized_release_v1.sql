-- Private, version-bound association release. No new content publication.
create or replace function facodi.kf_prepare_curation_release_v1(p_mission integer,p_unit uuid,p_resource uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m jsonb; a jsonb; s jsonb; doc jsonb; k text; rid uuid; existing facodi.kf_bridge_receipts%rowtype;
begin
 if p_mission is null or p_mission<=0 or p_unit is null or p_resource is null then return jsonb_build_object('ok',false,'reason','invalid_identity'); end if;
 select x into m from jsonb_array_elements(facodi.kf_curation_manufacturing_manifest_v1()) x where x->>'unit_id'=p_unit::text and x->>'scope'='curation_report_only' and x->>'supplementary'='1';
 if m is null then return jsonb_build_object('ok',false,'reason','manifest_missing'); end if;
 select x into a from jsonb_array_elements(m->'assessments') x where x->>'resource_id'=p_resource::text and x->>'decision'='supplementary_candidate';
 s:=facodi.kf_curation_candidate_snapshot_v1(p_unit,p_resource);
 if a is null or s is null or a->>'snapshot_digest' is distinct from encode(sha256(convert_to(s::text,'UTF8')),'hex') then return jsonb_build_object('ok',false,'reason','candidate_mismatch'); end if;
 k:='odoo:edu-facodi:task:'||p_mission||':curation-association-v1:'||(m->>'digest')||':'||p_resource;
 doc:=jsonb_build_object('contract','curation_association.v1','scope','original_youtube_reference','mission_id',p_mission,'unit_id',p_unit,'resource_id',p_resource,'manifest_digest',m->>'digest','candidate_digest',a->>'snapshot_digest','job_id',a->>'job_id','decision','pending','editorial_decision','pending','release_mode','scheduled','review',null);
 insert into facodi.kf_bridge_receipts(source_task_id,event_key,payload,status) values(p_mission,k,doc,'received') on conflict(event_key) do nothing returning id into rid;
 if rid is null then select * into existing from facodi.kf_bridge_receipts where event_key=k; rid:=existing.id; end if;
 return jsonb_build_object('ok',true,'receipt_id',rid,'status',coalesce(existing.status,'received'),'authorization_required',true);
end $$;
revoke all on function facodi.kf_prepare_curation_release_v1(integer,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_prepare_curation_release_v1(integer,uuid,uuid) to postgres;

create or replace function facodi.kf_release_curation_association_v1(p_receipt uuid,p_dry_run boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r facodi.kf_bridge_receipts%rowtype; a facodi.kf_release_authorizations%rowtype; s jsonb; m jsonb; candidate jsonb; rev jsonb; uid uuid; rid uuid; parent_id uuid; legacy_id uuid; vid text; original_title text; seq integer; relation_id uuid; uv_id uuid; meta jsonb;
begin
 select * into r from facodi.kf_bridge_receipts where id=p_receipt for update;
 if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
 if r.payload->>'contract' is distinct from 'curation_association.v1' or r.payload->>'scope' is distinct from 'original_youtube_reference' then return jsonb_build_object('ok',false,'reason','contract_mismatch'); end if;
 if r.status='applied' then return jsonb_build_object('ok',true,'applied',false,'reason','already_applied'); end if;
 if r.status<>'reviewed' or r.payload->>'decision' is distinct from 'pass' or r.payload->>'editorial_decision' is distinct from 'pass' or r.payload->>'release_mode' is distinct from 'scheduled' or r.payload->>'release_authorization' is distinct from 'editorial_admin' then return jsonb_build_object('ok',false,'reason','unapproved'); end if;
 select * into a from facodi.kf_release_authorizations where receipt_id=r.id for update;
 if not found or a.revoked_at is not null or a.expires_at<=now() or a.payload_hash is distinct from encode(sha256(convert_to(r.payload::text,'UTF8')),'hex') then return jsonb_build_object('ok',false,'reason','authorization_missing_or_stale'); end if;
 if not pg_input_is_valid(coalesce(r.payload->>'unit_id',''),'uuid') or not pg_input_is_valid(coalesce(r.payload->>'resource_id',''),'uuid') or coalesce(r.payload->>'manifest_digest','') !~ '^[0-9a-f]{64}$' or coalesce(r.payload->>'candidate_digest','') !~ '^[0-9a-f]{64}$' or r.payload->>'mission_id' is distinct from r.source_task_id::text then return jsonb_build_object('ok',false,'reason','invalid_identity'); end if;
 rev:=r.payload->'review';
 if jsonb_typeof(rev) is distinct from 'object' or rev->'curriculum_current_verified' is distinct from 'true'::jsonb or rev->'independent_review_passed' is distinct from 'true'::jsonb or rev->'reference_rights_verified' is distinct from 'true'::jsonb or rev->>'fit' is distinct from 'supplementary' or length(btrim(coalesce(rev->>'reviewer',''))) not between 3 and 200 or length(btrim(coalesce(rev->>'evidence',''))) not between 80 and 4000 or coalesce(rev->>'syllabus_url','') !~ '^https://' or coalesce(rev->>'odoo_order_id','') !~ '^[1-9][0-9]*$' then return jsonb_build_object('ok',false,'reason','review_evidence_missing'); end if;
 if jsonb_typeof(rev->'passed_qc_ids') is distinct from 'array' then return jsonb_build_object('ok',false,'reason','quality_evidence_missing'); end if;
 if jsonb_array_length(rev->'passed_qc_ids')<>4 or (select count(distinct x) from jsonb_array_elements_text(rev->'passed_qc_ids') x where x ~ '^[1-9][0-9]*$')<>4 then return jsonb_build_object('ok',false,'reason','quality_evidence_missing'); end if;
 uid:=(r.payload->>'unit_id')::uuid; rid:=(r.payload->>'resource_id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended('kf-curation-release:'||uid,0));
 select u.learning_object_id into parent_id from facodi.curricular_units u join facodi.courses c on c.id=u.course_id join facodi.learning_objects o on o.id=u.learning_object_id where u.id=uid and u.published and u.status='active' and c.published and c.status='active' and o.published and o.status='active' and o.object_type='curricular_unit' for update of u,c,o;
 if not found then return jsonb_build_object('ok',false,'reason','unit_not_public'); end if;
 select o.source_id,o.title into vid,original_title from facodi.learning_objects o join facodi.youtube_videos y on y.learning_object_id=o.id and y.youtube_video_id=o.source_id and y.status='published' where o.id=rid and o.published and o.status='active' and o.object_type='video' and o.source_id ~ '^[A-Za-z0-9_-]{11}$' and o.source_url='https://www.youtube.com/watch?v='||o.source_id for update of o,y;
 if not found then return jsonb_build_object('ok',false,'reason','resource_not_public'); end if;
 select id into legacy_id from public.videos where youtube_id=vid for update;
 if not found or (select count(*) from public.videos where youtube_id=vid)<>1 then return jsonb_build_object('ok',false,'reason','legacy_identity_missing_or_duplicate'); end if;
 if exists(select 1 from facodi.learning_object_relations where parent_object_id=parent_id and child_object_id=rid) or exists(select 1 from facodi.unit_videos where curricular_unit_id=uid and video_id=legacy_id) then return jsonb_build_object('ok',false,'reason','existing_association'); end if;
 s:=facodi.kf_curation_candidate_snapshot_v1(uid,rid);
 if s is null or encode(sha256(convert_to(s::text,'UTF8')),'hex') is distinct from r.payload->>'candidate_digest' then return jsonb_build_object('ok',false,'reason','candidate_version_conflict'); end if;
 select x into m from jsonb_array_elements(facodi.kf_curation_manufacturing_manifest_v1()) x where x->>'unit_id'=uid::text and x->>'digest'=r.payload->>'manifest_digest' and x->>'supplementary'='1';
 if m is null then return jsonb_build_object('ok',false,'reason','manifest_version_conflict'); end if;
 select x into candidate from jsonb_array_elements(m->'assessments') x where x->>'resource_id'=rid::text and x->>'decision'='supplementary_candidate' and x->>'job_id'=r.payload->>'job_id' and x->>'snapshot_digest'=r.payload->>'candidate_digest';
 if candidate is null or candidate->>'title' is distinct from original_title then return jsonb_build_object('ok',false,'reason','candidate_evidence_conflict'); end if;
 if exists(select 1 from facodi.kf_youtube_source_health h where h.learning_object_id=rid and h.youtube_id=vid and h.consecutive_unavailable_days>=2) then return jsonb_build_object('ok',false,'reason','source_incident_open'); end if;
 if p_dry_run is distinct from false then return jsonb_build_object('ok',true,'applied',false,'reason','validated','unit_id',uid,'resource_id',rid); end if;
 select greatest(coalesce((select max(position) from facodi.unit_videos where curricular_unit_id=uid),0),coalesce((select max(position) from facodi.learning_object_relations where parent_object_id=parent_id and relation_type='contains'),0))+1 into seq;
 meta:=jsonb_build_object('review_status','approved','review_scope','kf_curated_original_reference','level','supplementary_topic_matched','publication_scope','original_youtube_reference','kf_release_receipt_id',r.id,'full_playback_reviewed',false);
 insert into facodi.learning_object_relations(parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata) values(parent_id,rid,'contains',seq,'kf_curation_release_v1',meta) returning id into relation_id;
 insert into facodi.unit_videos(curricular_unit_id,video_id,position,metadata) values(uid,legacy_id,seq,meta) returning id into uv_id;
 update facodi.kf_bridge_receipts set status='applied',payload=payload||jsonb_build_object('relation_id',relation_id,'unit_video_id',uv_id,'applied_at',now(),'release_channel','scheduled_editorial_admin') where id=r.id;
 return jsonb_build_object('ok',true,'applied',true,'receipt_id',r.id,'relation_id',relation_id,'unit_video_id',uv_id);
end $$;
revoke all on function facodi.kf_release_curation_association_v1(uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_release_curation_association_v1(uuid,boolean) to postgres;

create policy facodi_public_read_kf_curated_original_references on facodi.learning_object_relations for select to anon,authenticated using (
 relation_type='contains' and created_by_mechanism='kf_curation_release_v1' and metadata->>'review_status'='approved' and metadata->>'review_scope'='kf_curated_original_reference' and metadata->>'publication_scope'='original_youtube_reference' and coalesce(metadata->>'kf_release_receipt_id','') ~ '^[0-9a-f-]{36}$'
 and exists(select 1 from facodi.learning_objects p join facodi.curricular_units u on u.learning_object_id=p.id join facodi.courses c on c.id=u.course_id where p.id=learning_object_relations.parent_object_id and p.published and p.status='active' and p.object_type='curricular_unit' and u.published and u.status='active' and c.published and c.status='active')
 and exists(select 1 from facodi.learning_objects o where o.id=learning_object_relations.child_object_id and o.published and o.status='active' and o.object_type='video' and o.source_url='https://www.youtube.com/watch?v='||o.source_id)
);
create or replace function facodi.kf_run_approved_curation_release_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare rid uuid; result jsonb;
begin
 if not pg_try_advisory_xact_lock(391726,24) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select r.id into rid from facodi.kf_bridge_receipts r join facodi.kf_release_authorizations a on a.receipt_id=r.id and a.revoked_at is null and a.expires_at>now() and a.payload_hash=encode(sha256(convert_to(r.payload::text,'UTF8')),'hex') where r.status='reviewed' and r.payload->>'contract'='curation_association.v1' and r.payload->>'decision'='pass' and r.payload->>'editorial_decision'='pass' and r.payload->>'release_mode'='scheduled' and r.payload->>'release_authorization'='editorial_admin' order by r.created_at,r.id for update of r skip locked limit 1;
 if not found then return jsonb_build_object('ok',true,'reason','empty'); end if;
 result:=facodi.kf_release_curation_association_v1(rid,false);
 if result->>'ok'='false' then update facodi.kf_bridge_receipts set status='rejected',payload=payload||jsonb_build_object('release_failure',result,'release_failed_at',now()) where id=rid; end if;
 return result;
end $$;
revoke all on function facodi.kf_run_approved_curation_release_v1() from public,anon,authenticated,service_role;
grant execute on function facodi.kf_run_approved_curation_release_v1() to postgres;

