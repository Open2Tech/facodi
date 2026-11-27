create or replace function facodi.kf_validate_community_course_v1(p_slug text,p_expected_modules integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare root facodi.learning_objects%rowtype; n integer; bad integer; labs integer; positions integer; issues text[]:=array[]::text[];
begin
 if p_expected_modules is null or p_expected_modules not between 1 and 100 then return jsonb_build_object('ok',false,'reason','invalid_expected_count'); end if;
 select * into root from facodi.learning_objects where slug=p_slug and object_type='collection' and metadata->'presentation'->>'kind'='community_course';
 if not found then return jsonb_build_object('ok',false,'reason','not_community_course'); end if;
 select count(*),count(distinct r.position),count(*) filter(where o.language is distinct from root.language or nullif(trim(o.title),'') is null or nullif(trim(o.description),'') is null or coalesce(o.source_url,'') !~ '^https://' or o.metadata->'course_reader'->>'slug' is distinct from root.slug or o.metadata->'course_reader'->>'lesson' is distinct from r.position::text or (root.published and (not o.published or o.status not in ('active','published')))) into n,positions,bad
 from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=root.id and r.relation_type='contains' and o.object_type='module';
 if n<>p_expected_modules or positions<>n then issues:=array_append(issues,'module_count_or_order'); end if;
 if bad>0 then issues:=array_append(issues,'module_metadata_or_visibility'); end if;
 select count(*) into bad from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=root.id and r.relation_type='contains' and o.object_type='module' and (case when jsonb_typeof(o.metadata->'checkpoint'->'choices')='array' then jsonb_array_length(o.metadata->'checkpoint'->'choices')<>3 or (select count(*) from jsonb_array_elements(o.metadata->'checkpoint'->'choices') c where c->>'correct'='true')<>1 or (select count(distinct c->>'label') from jsonb_array_elements(o.metadata->'checkpoint'->'choices') c)<>3 else true end or nullif(trim(o.metadata->'checkpoint'->>'question'),'') is null or nullif(trim(o.metadata->>'activity_prompt'),'') is null or nullif(trim(o.metadata->>'self_review_criteria'),'') is null);
 if bad>0 then issues:=array_append(issues,'checkpoint_or_activity'); end if;
 select count(*) into labs from facodi.learning_object_relations r join facodi.learning_objects o on o.id=r.child_object_id where r.parent_object_id=root.id and r.relation_type='contains' and o.object_type='module' and exists(select 1 from facodi.learning_object_relations rr join facodi.learning_objects d on d.id=rr.child_object_id where rr.parent_object_id=o.id and rr.relation_type='contains' and d.object_type='document' and d.language=root.language and (not root.published or (d.published and d.status in ('active','published'))));
 if labs<>n then issues:=array_append(issues,'missing_practical_lab'); end if;
 return jsonb_build_object('ok',cardinality(issues)=0,'slug',root.slug,'language',root.language,'modules',n,'modules_with_lab',labs,'issues',to_jsonb(issues),'scope','structural validation only; not scientific or visual QA');
end $$;
revoke all on function facodi.kf_validate_community_course_v1(text,integer) from public,anon,authenticated,service_role;
