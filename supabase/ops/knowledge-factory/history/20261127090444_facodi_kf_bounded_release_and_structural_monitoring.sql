create or replace function facodi.kf_run_approved_release_queue_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r facodi.kf_bridge_receipts%rowtype; result jsonb;
begin
 if not pg_try_advisory_xact_lock(391726,1) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select * into r from facodi.kf_bridge_receipts where status='reviewed' and payload->>'contract'='checkpoint_question.v1' and payload->>'decision'='pass' and payload->>'editorial_decision'='pass' and payload->>'release_mode'='scheduled' and payload->>'release_authorization'='editorial_admin' order by created_at,id for update skip locked limit 1;
 if not found then return jsonb_build_object('ok',true,'reason','empty'); end if;
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
end $$;
revoke all on function facodi.kf_run_approved_release_queue_v1() from public,anon,authenticated,service_role;
create or replace function facodi.kf_check_public_course_structure_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare pt jsonb; en jsonb;
begin
 pt:=facodi.kf_validate_community_course_v1('comunidade-odoo19-mrp',11);
 en:=facodi.kf_validate_community_course_v1('community-odoo19-mrp',11);
 if pt->>'ok' is distinct from 'true' or en->>'ok' is distinct from 'true' then raise exception 'KF structural regression: PT %, EN %',pt->'issues',en->'issues'; end if;
 return jsonb_build_object('ok',true,'pt',pt,'en',en);
end $$;
revoke all on function facodi.kf_check_public_course_structure_v1() from public,anon,authenticated,service_role;
