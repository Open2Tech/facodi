create or replace function facodi.kf_release_bom_revision(p_hash text,p_payload jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r facodi.kf_bridge_receipts%rowtype; tid integer; d text; qs jsonb; before_state jsonb; after_state jsonb; n integer;
begin
 if p_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok',false,'reason','unauthorized'); end if;
 select source_task_id into tid from facodi.kf_bridge_capabilities where token_hash=p_hash and enabled and expires_at>now();
 if tid is null then return jsonb_build_object('ok',false,'reason','unauthorized'); end if;
 select * into r from facodi.kf_bridge_receipts where source_task_id=tid and event_key='odoo:edu-facodi:bom-v3:release' for update;
 if not found then return jsonb_build_object('ok',false,'reason','unapproved'); end if;
 d:=p_payload->>'description';
 if p_payload->>'_model' is distinct from 'project.task' or p_payload->>'_id' is distinct from tid::text or p_payload->>'_action' is distinct from r.payload->>'action' or d is distinct from r.payload->>'description' then return jsonb_build_object('ok',false,'reason','payload_mismatch'); end if;
 if r.status='applied' then return jsonb_build_object('ok',true,'receipt_id',r.id,'applied',false); end if;
 if r.status<>'reviewed' or r.payload->>'decision' is distinct from 'pass' then return jsonb_build_object('ok',false,'reason','unapproved'); end if;
 qs:=r.payload->'questions';
 if jsonb_typeof(qs) is distinct from 'object' or length(qs->>'pt') not between 25 and 240 or length(qs->>'en') not between 25 and 240 or (qs->>'pt') !~ '10.*2.*[?]$' or (qs->>'en') !~ '10.*2.*[?]$' or (qs->>'pt') ~ '[<>]|20' or (qs->>'en') ~ '[<>]|20' then return jsonb_build_object('ok',false,'reason','invalid_questions'); end if;
 perform id from facodi.learning_objects where slug in ('odoo19-mrp-bom-pt','odoo19-mrp-bom-en') order by id for update;
 select count(*),jsonb_object_agg(language,jsonb_build_object('checkpoint',metadata->'checkpoint','revision',metadata->>'checkpoint_revision')) into n,before_state from facodi.learning_objects o where slug in ('odoo19-mrp-bom-pt','odoo19-mrp-bom-en') and object_type='module' and published and status='active' and metadata->>'editorial_batch'='facodi-kf-mrp19-20261126' and metadata->>'checkpoint_revision'='2026-11-26-v2' and (select count(*) from jsonb_array_elements(metadata->'checkpoint'->'choices') c where c->>'correct'='true' and c->>'label'='20')=1 and (select count(*) from jsonb_array_elements(metadata->'checkpoint'->'choices') c where c->>'correct'='true')=1 and (select count(distinct c->>'label') from jsonb_array_elements(metadata->'checkpoint'->'choices') c)=3;
 if n<>2 or before_state is distinct from r.payload->'expected_before' then return jsonb_build_object('ok',false,'reason','version_conflict'); end if;
 update facodi.learning_objects set metadata=jsonb_set(metadata,'{checkpoint,question}',to_jsonb(qs->>language))||jsonb_build_object('checkpoint_revision','2026-11-27-v3'),updated_at=now() where slug in ('odoo19-mrp-bom-pt','odoo19-mrp-bom-en');
 select jsonb_object_agg(language,jsonb_build_object('checkpoint',metadata->'checkpoint','revision',metadata->>'checkpoint_revision')) into after_state from facodi.learning_objects where slug in ('odoo19-mrp-bom-pt','odoo19-mrp-bom-en');
 update facodi.kf_bridge_receipts set status='applied',payload=payload||jsonb_build_object('before',before_state,'after',after_state,'applied_at',now()) where id=r.id;
 return jsonb_build_object('ok',true,'receipt_id',r.id,'applied',true);
end $$;
revoke all on function facodi.kf_release_bom_revision(text,jsonb) from public,anon,authenticated;
grant execute on function facodi.kf_release_bom_revision(text,jsonb) to service_role;
