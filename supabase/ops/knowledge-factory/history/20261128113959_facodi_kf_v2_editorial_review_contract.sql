create or replace function facodi.kf_review_v2_classification_v1(p_classification uuid,p_action text,p_actor uuid,p_unit uuid default null,p_course uuid default null,p_notes text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v facodi.video_classifications%rowtype;j facodi.analysis_jobs%rowtype; v_unit_id uuid; v_course_id uuid; verdict text;
begin
 if p_actor is null or not exists(select 1 from auth.users where id=p_actor and raw_app_meta_data->>'role' in ('editor','admin')) then return jsonb_build_object('success',false,'error','forbidden'); end if;
 if p_action not in ('accept','reject','correct') or length(btrim(coalesce(p_notes,''))) not between 10 and 2000 then return jsonb_build_object('success',false,'error','invalid_review'); end if;
 select * into v from facodi.video_classifications where id=p_classification and metadata->>'contract'='v2_reference_review.v1' and status='needs_review' and needs_review for update;
 if not found then return jsonb_build_object('success',false,'error','classification_not_pending'); end if;
 select * into j from facodi.analysis_jobs where id::text=v.metadata->>'job_id' and video_id=v.video_id and request_source='facodi_editor_pipeline' and input_payload->>'contract'='v2_reference_review.v1' and status='needs_review' and result_payload->'classification'->>'id'=v.id::text for update;
 if not found then return jsonb_build_object('success',false,'error','job_identity_conflict'); end if;
 v_unit_id:=case when p_action='correct' then p_unit else v.curricular_unit_id end;
 v_course_id:=case when p_action='correct' then p_course else v.course_id end;
 if p_action<>'reject' and not exists(select 1 from facodi.curricular_units u join facodi.courses c on c.id=u.course_id where u.id=v_unit_id and u.course_id=v_course_id and u.published and u.status='active' and c.published and c.status='active') then return jsonb_build_object('success',false,'error','invalid_curricular_identity'); end if;
 verdict:=case when p_action='reject' then 'rejected' else 'approved' end;
 update facodi.video_classifications set status=verdict,needs_review=false,course_id=v_course_id,curricular_unit_id=v_unit_id,reviewed_by=p_actor,reviewed_at=now(),metadata=metadata||jsonb_build_object('review_action',p_action,'review_notes',btrim(p_notes),'publication_authorized',false) where id=v.id;
 update facodi.analysis_jobs set status='succeeded',current_step='editorial_review_completed',completed_at=now(),result_payload=result_payload||jsonb_build_object('editorial_review',jsonb_build_object('decision',verdict,'classification_id',v.id,'unit_id',v_unit_id,'course_id',v_course_id,'publication_authorized',false)) where id=j.id;
 insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(j.id,'editorial_review_completed','Editor reviewed the preliminary classification; no publication.',jsonb_build_object('decision',verdict,'classification_id',v.id));
 return jsonb_build_object('success',true,'classification_id',v.id,'status',verdict,'job_id',j.id,'publication_authorized',false);
end $$;
revoke all on function facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text) to service_role;
