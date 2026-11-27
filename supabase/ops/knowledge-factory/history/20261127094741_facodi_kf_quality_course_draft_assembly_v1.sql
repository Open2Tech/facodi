create or replace function facodi.kf_assemble_quality_lesson_v1(p_receipt uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r facodi.kf_bridge_receipts%rowtype; dn jsonb; qa jsonb; parts text[]; f text[]; k text; pos integer; lang text; idx integer; root_slug text; module_slug text; lab_slug text; src text; root_id uuid; mid uuid; lid uuid; md jsonb; choices jsonb; labels text[]; correct integer; j integer; batch constant text:='facodi-kf-quality19-20261127'; a text; body text;
begin
 select * into r from facodi.kf_bridge_receipts where id=p_receipt for update;
 if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
 if r.payload->>'assembly_state'='draft_assembled' then return jsonb_build_object('ok',true,'reason','already_assembled'); end if;
 if r.status<>'received' or r.payload->>'contract' is distinct from 'community_course_generation.v1' or r.payload->>'parent_id' is distinct from '120' or r.payload->>'odoo_stage' is distinct from '18' or r.payload->>'source' is distinct from 'odoo_json2_read' then return jsonb_build_object('ok',false,'reason','out_of_scope_or_not_received'); end if;
 if jsonb_typeof(r.payload->'notes') is distinct from 'array' then return jsonb_build_object('ok',false,'reason','missing_notes'); end if;
 if (select count(*) from jsonb_array_elements(r.payload->'notes') n where n->>'subject'='KF-COURSE-LESSON-DRAFT-v1')<>1 or (select count(*) from jsonb_array_elements(r.payload->'notes') n where n->>'subject'='KF-COURSE-LESSON-QA-v1')<>1 then return jsonb_build_object('ok',false,'reason','note_cardinality'); end if;
 select n into dn from jsonb_array_elements(r.payload->'notes') n where n->>'subject'='KF-COURSE-LESSON-DRAFT-v1';
 select n into qa from jsonb_array_elements(r.payload->'notes') n where n->>'subject'='KF-COURSE-LESSON-QA-v1';
 if dn->>'res_id' is distinct from r.source_task_id::text or qa->>'res_id' is distinct from r.source_task_id::text or coalesce(qa->>'body','') not like '<p>pass%' or coalesce(dn->>'id','') !~ '^[0-9]+$' or coalesce(qa->>'id','') !~ '^[0-9]+$' then return jsonb_build_object('ok',false,'reason','qa_or_identity'); end if;
 body:=regexp_replace(coalesce(dn->>'body',''),'^<p>|</p>$','','g');
 body:=replace(replace(replace(replace(body,'&quot;','"'),'&#39;',chr(39)),'&#x27;',chr(39)),'&amp;','&');
 parts:=string_to_array(body,'|');
 if cardinality(parts)<>14 or parts[1]<>'KF-LESSON-v1' then return jsonb_build_object('ok',false,'reason','invalid_contract'); end if;
 k:=parts[2]; f:=parts[3:14];
 if k='qcp' and r.source_task_id=124 then pos:=1; elsif k='checks' and r.source_task_id=122 then pos:=2; elsif k='alerts' and r.source_task_id=123 then pos:=3; else return jsonb_build_object('ok',false,'reason','manifest_scope'); end if;
 src:='https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/quality/quality_management/'||case k when 'qcp' then 'quality_control_points.html' when 'checks' then 'quality_checks.html' else 'quality_alerts.html' end;
 for j in 1..12 loop
  a:=f[j];
  if length(trim(a)) not between (case when j<=2 then 5 when j in (5,6) then 100 else 25 end) and (case when j<=2 then 180 when j in (5,6) then 1800 else 1000 end) or a ~ '[<>[:cntrl:]]' or (j>=11 and right(a,1)<>'?') then return jsonb_build_object('ok',false,'reason','invalid_field','field',j); end if;
 end loop;
 -- Preflight both language targets before writing; never replace existing content.
 foreach lang in array array['pt','en'] loop
  root_slug:=case lang when 'pt' then 'comunidade-odoo19-qualidade' else 'community-odoo19-quality' end;
  module_slug:='odoo19-quality-'||k||'-'||lang;
  if not exists(select 1 from facodi.learning_objects where slug=root_slug and object_type='collection' and not published and status='draft' and metadata->>'editorial_batch'=batch) or exists(select 1 from facodi.learning_objects where slug in (module_slug,module_slug||'-lab')) then return jsonb_build_object('ok',false,'reason','target_exists_or_invalid_root'); end if;
 end loop;
 foreach lang in array array['pt','en'] loop
  idx:=case lang when 'pt' then 1 else 2 end;
  root_slug:=case lang when 'pt' then 'comunidade-odoo19-qualidade' else 'community-odoo19-quality' end;
  module_slug:='odoo19-quality-'||k||'-'||lang; lab_slug:=module_slug||'-lab';
  select id into strict root_id from facodi.learning_objects where slug=root_slug and not published for update;
  labels:=case k when 'qcp' then case lang when 'pt' then array['Ponto de controlo de qualidade','Alerta de qualidade','Fatura'] else array['Quality control point','Quality alert','Invoice'] end when 'checks' then case lang when 'pt' then array['Fatura','Verificação manual','Ordem de compra'] else array['Invoice','Manual quality check','Purchase order'] end else case lang when 'pt' then array['Lista de materiais','Fatura','Alerta de qualidade'] else array['Bill of materials','Invoice','Quality alert'] end end;
  correct:=pos;
  choices:='[]'::jsonb;
  for j in 1..3 loop choices:=choices||jsonb_build_array(jsonb_build_object('label',labels[j],'correct',j=correct,'explanation',case when j=correct then f[8+idx] when lang='pt' then 'Revê o cenário e distingue os registos do Odoo.' else 'Review the scenario and distinguish the Odoo records.' end)); end loop;
  md:=jsonb_build_object('editorial_batch',batch,'course_reader',jsonb_build_object('slug',root_slug,'lesson',pos),'translation_group','odoo19-quality-'||k,'activity_prompt',f[6+idx],'suggested_deliverable',f[6+idx],'self_review_criteria',f[8+idx],'checkpoint',jsonb_build_object('question',f[10+idx],'choices',choices),'teaching_figure',jsonb_build_object('title',case lang when 'pt' then 'Do conceito à evidência' else 'From concept to evidence' end,'caption',f[8+idx],'chart',jsonb_build_object('kind','flow','rows',jsonb_build_array(jsonb_build_object('label',case lang when 'pt' then 'Entender' else 'Understand' end,'detail',f[idx]),jsonb_build_object('label',case lang when 'pt' then 'Experimentar' else 'Practice' end,'detail',f[6+idx]),jsonb_build_object('label',case lang when 'pt' then 'Conferir' else 'Check' end,'detail',f[8+idx])))),'knowledge_factory',jsonb_build_object('task_id',r.source_task_id,'draft_note_id',dn->>'id','qa_note_id',qa->>'id','receipt_id',r.id,'contract','community_course_generation.v1','editorial_state','awaiting_editorial_review'));
  insert into facodi.learning_objects(object_type,slug,title,description,language,source_url,source_id,source_type,status,published,metadata,objectives,tags) values('module',module_slug,lpad(pos::text,2,'0')||' · '||f[idx],f[4+idx],lang,src,'facodi:'||module_slug,'manual','draft',false,md,jsonb_build_array(f[2+idx]),array['Odoo','Odoo 19','Quality','MRP','Cursos da Comunidade']) returning id into mid;
  insert into facodi.learning_objects(object_type,slug,title,description,language,source_url,source_id,source_type,status,published,metadata,objectives,tags) values('document',lab_slug,case lang when 'pt' then 'Ficha prática · ' else 'Lab · ' end||f[idx],f[6+idx]||chr(10)||chr(10)||f[8+idx],lang,src,'facodi:'||lab_slug,'manual','draft',false,jsonb_build_object('editorial_batch',batch,'course_reader',jsonb_build_object('slug',root_slug,'lesson',pos),'translation_group','odoo19-quality-'||k||'-lab','knowledge_factory',md->'knowledge_factory'),jsonb_build_array(f[2+idx]),array['Odoo','Odoo 19','Quality','MRP','Cursos da Comunidade']) returning id into lid;
  insert into facodi.learning_object_relations(parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata) values(root_id,mid,'contains',pos,'knowledge_factory',jsonb_build_object('editorial_batch',batch,'review_status','draft')),(mid,lid,'contains',1,'knowledge_factory',jsonb_build_object('editorial_batch',batch,'review_status','draft'));
 end loop;
 update facodi.kf_bridge_receipts set payload=payload||jsonb_build_object('assembly_state','draft_assembled','module_key',k,'assembled_at',now(),'editorial_decision','pending','draft_note_id',dn->>'id','qa_note_id',qa->>'id') where id=r.id;
 return jsonb_build_object('ok',true,'reason','draft_assembled','module',k,'objects',4);
end $$;
revoke all on function facodi.kf_assemble_quality_lesson_v1(uuid) from public,anon,authenticated,service_role;
create or replace function facodi.kf_run_lesson_assembly_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r uuid; result jsonb;
begin
 if not pg_try_advisory_xact_lock(391726,4) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select id into r from facodi.kf_bridge_receipts where status='received' and payload->>'contract'='community_course_generation.v1' and payload->>'parent_id'='120' and coalesce(payload->>'assembly_state','')='' order by created_at,id for update skip locked limit 1;
 if r is null then return jsonb_build_object('ok',true,'reason','empty'); end if;
 result:=facodi.kf_assemble_quality_lesson_v1(r);
 if result->>'ok' is distinct from 'true' then update facodi.kf_bridge_receipts set payload=payload||jsonb_build_object('assembly_state','blocked','assembly_failure',result,'assembly_checked_at',now()) where id=r; end if;
 return result;
end $$;
revoke all on function facodi.kf_run_lesson_assembly_v1() from public,anon,authenticated,service_role;
