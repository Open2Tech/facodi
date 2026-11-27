create or replace function facodi.kf_release_checkpoint_question_v1(p_receipt uuid,p_dry_run boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r facodi.kf_bridge_receipts%rowtype; item jsonb; obj facodi.learning_objects%rowtype; target uuid; q text; expected jsonb; snapshots jsonb:='{}'::jsonb; after_state jsonb:='{}'::jsonb; cnt integer; rev text;
begin
 select * into r from facodi.kf_bridge_receipts where id=p_receipt for update;
 if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
 if r.payload->>'contract' is distinct from 'checkpoint_question.v1' then return jsonb_build_object('ok',false,'reason','contract_mismatch'); end if;
 if r.status='applied' then return jsonb_build_object('ok',true,'applied',false,'reason','already_applied'); end if;
 if r.status<>'reviewed' or r.payload->>'decision' is distinct from 'pass' or r.payload->>'editorial_decision' is distinct from 'pass' or coalesce(r.payload->>'qa_note_id','') !~ '^[0-9]+$' then return jsonb_build_object('ok',false,'reason','unapproved'); end if;
 if jsonb_typeof(r.payload->'targets') is distinct from 'array' then return jsonb_build_object('ok',false,'reason','invalid_targets'); end if;
 if jsonb_array_length(r.payload->'targets')<>2 then return jsonb_build_object('ok',false,'reason','invalid_target_count'); end if;
 select count(distinct x->>'id') into cnt from jsonb_array_elements(r.payload->'targets') x;
 if cnt<>2 then return jsonb_build_object('ok',false,'reason','duplicate_target'); end if;
 rev:='kf-v1-'||r.id::text;
 for item in select x from jsonb_array_elements(r.payload->'targets') x order by x->>'id' loop
   if coalesce(item->>'id','') !~ '^[0-9a-fA-F-]{36}$' then return jsonb_build_object('ok',false,'reason','invalid_id'); end if;
   target:=(item->>'id')::uuid; q:=item->>'question'; expected:=item->'expected';
   if q is null or length(q) not between 25 and 300 or right(q,1)<>'?' or q ~ '[<>]|[[:cntrl:]]' then return jsonb_build_object('ok',false,'reason','invalid_question'); end if;
   select * into obj from facodi.learning_objects where id=target and published and status='active' and object_type='module' and metadata->>'editorial_batch'='facodi-kf-mrp19-20261126' for update;
   if not found or obj.language not in ('pt','en') or obj.language is distinct from item->>'language' or snapshots ? obj.language then return jsonb_build_object('ok',false,'reason','scope_or_language'); end if;
   if jsonb_build_object('checkpoint',obj.metadata->'checkpoint','revision',obj.metadata->>'checkpoint_revision') is distinct from expected then return jsonb_build_object('ok',false,'reason','version_conflict'); end if;
   if jsonb_typeof(obj.metadata->'checkpoint'->'choices') is distinct from 'array' then return jsonb_build_object('ok',false,'reason','invalid_choices'); end if;
   if jsonb_array_length(obj.metadata->'checkpoint'->'choices')<>3 or (select count(*) from jsonb_array_elements(obj.metadata->'checkpoint'->'choices') c where c->>'correct'='true')<>1 or (select count(distinct c->>'label') from jsonb_array_elements(obj.metadata->'checkpoint'->'choices') c)<>3 then return jsonb_build_object('ok',false,'reason','invalid_choices'); end if;
   snapshots:=snapshots||jsonb_build_object(obj.language,expected);
 end loop;
 if not (snapshots ? 'pt' and snapshots ? 'en') then return jsonb_build_object('ok',false,'reason','language_pair'); end if;
 if (select count(distinct o.metadata->>'translation_group') from facodi.learning_objects o join jsonb_array_elements(r.payload->'targets') x on o.id=(x->>'id')::uuid)<>1 then return jsonb_build_object('ok',false,'reason','translation_group_mismatch'); end if;
 if p_dry_run is distinct from false then return jsonb_build_object('ok',true,'applied',false,'reason','validated','targets',2); end if;
 for item in select x from jsonb_array_elements(r.payload->'targets') x loop
   update facodi.learning_objects set metadata=jsonb_set(metadata,'{checkpoint,question}',to_jsonb(item->>'question'))||jsonb_build_object('checkpoint_revision',rev),updated_at=now() where id=(item->>'id')::uuid returning * into obj;
   after_state:=after_state||jsonb_build_object(obj.language,jsonb_build_object('checkpoint',obj.metadata->'checkpoint','revision',rev));
 end loop;
 update facodi.kf_bridge_receipts set status='applied',payload=payload||jsonb_build_object('before',snapshots,'after',after_state,'applied_at',now(),'release_channel','authorized_editorial_mcp') where id=r.id;
 return jsonb_build_object('ok',true,'applied',true,'receipt_id',r.id,'targets',2);
end $$;
revoke all on function facodi.kf_release_checkpoint_question_v1(uuid,boolean) from public,anon,authenticated,service_role;
