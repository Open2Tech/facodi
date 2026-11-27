create or replace function facodi.kf_publish_approved_youtube_references()
returns integer language plpgsql security invoker set search_path='' as $$
declare candidate record; reply extensions.http_response; info jsonb; n int:=0;
begin
 if not pg_try_advisory_xact_lock(391726,23) or not exists(select from facodi.suggestion_pipeline_settings where auto_publish_enabled) then return 0; end if;
 for candidate in
   select o.id,o.title,substring(o.source_url from 'v=([A-Za-z0-9_-]{11})$') video_id
   from facodi.learning_objects o join facodi.resource_suggestions s on s.learning_object_id=o.id and s.canonical_url=o.source_url
   join facodi.curricular_units u on u.id=s.curricular_unit_id join facodi.courses c on c.id=u.course_id
   join facodi.learning_objects p on p.id=u.learning_object_id
   join facodi.learning_object_relations r on r.parent_object_id=p.id and r.child_object_id=o.id
   where o.object_type='video' and o.status='draft' and not o.published and s.status='approved' and s.provider='youtube'
   and o.source_url ~ '^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$'
   and c.published and c.status='active' and u.published and u.status='active' and p.published and p.status='active'
   and r.relation_type='contains' and r.created_by_mechanism='resource_suggestion_review'
   and r.metadata->>'review_status'='approved' and r.metadata->>'resource_suggestion_id'=s.id::text
   and not exists(select from facodi.learning_objects d where d.id<>o.id and d.published and (d.source_url=o.source_url or d.source_id=substring(o.source_url from 'v=([A-Za-z0-9_-]{11})$')))
   order by o.metadata->>'kf_reference_last_checked' nulls first,o.id limit 10 for update of o,s,u,c,p,r skip locked
 loop
   info:=null;
   begin
     select * into reply from extensions.http_get('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'||candidate.video_id);
     if reply.status=200 then info:=reply.content::jsonb; end if;
   exception when others then info:=null;
   end;
   if info->>'type'='video' and info->>'title'=candidate.title and nullif(btrim(info->>'author_name'),'') is not null then
     update facodi.learning_objects set published=true,status='active',updated_at=now(),
       description='Vídeo complementar. Consulta a fonte original no YouTube.',
       metadata=metadata||jsonb_build_object('publication_scope','original_youtube_reference','publication_basis','approved_curricular_link_and_verified_oembed','full_content_reviewed',false,'kf_reference_last_checked',now())
     where id=candidate.id;
     n:=n+1;
   else
     update facodi.learning_objects set metadata=metadata||jsonb_build_object('kf_reference_last_checked',now()) where id=candidate.id;
   end if;
 end loop;
 return n;
end $$;
revoke all on function facodi.kf_publish_approved_youtube_references() from public,anon,authenticated,service_role;
select cron.schedule('facodi-kf-approved-youtube-references','52 * * * *','select facodi.kf_publish_approved_youtube_references()');
