create or replace function facodi.kf_verify_legacy_video_source_v1(p_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o facodi.learning_objects%rowtype; r extensions.http_response; b jsonb; evidence jsonb; url text; matched boolean;
begin
select * into o from facodi.learning_objects where id=p_id and object_type='video' and status='draft' and not published and metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127' for update;
if not found or o.source_id !~ '^[A-Za-z0-9_-]{11}$' or o.source_url is distinct from 'https://www.youtube.com/watch?v='||o.source_id then return jsonb_build_object('ok',false,'reason','scope_or_identity'); end if;
select * into r from extensions.http_get('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'||o.source_id);
if r.status=200 then
 b:=r.content::jsonb;
 matched:=coalesce(b->>'title','')=o.title and nullif(b->>'author_name','') is not null and b->>'provider_name'='YouTube' and b->>'type'='video';
 evidence:=jsonb_build_object('status',r.status,'checked_at',now(),'title',b->>'title','author',b->>'author_name','author_url',b->>'author_url','provider',b->>'provider_name','title_match',matched,'scope','public_oembed_metadata_only','license_verified',false,'content_reviewed',false);
else evidence:=jsonb_build_object('status',r.status,'checked_at',now(),'title_match',false,'scope','public_oembed_metadata_only','license_verified',false,'content_reviewed',false); end if;
update facodi.learning_objects set metadata=metadata||jsonb_build_object('kf_source_evidence_v1',evidence),updated_at=now() where id=o.id;
return jsonb_build_object('ok',coalesce(matched,false),'video_id',o.source_id,'evidence',evidence);
exception when others then return jsonb_build_object('ok',false,'reason','transport_or_response_error');
end $$;
revoke all on function facodi.kf_verify_legacy_video_source_v1(uuid) from public,anon,authenticated,service_role;
