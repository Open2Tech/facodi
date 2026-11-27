create or replace function facodi.kf_dispatch_private_av_v2() returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text; r extensions.http_response; b jsonb;
begin
 if not pg_try_advisory_xact_lock(391726,7) then return jsonb_build_object('reason','busy'); end if;
 select decrypted_secret into k from vault.decrypted_secrets where name='facodi_suggestion_worker_secret';
 if k is null or length(k)<32 then raise exception 'Private AV credential unavailable'; end if;
 select * into r from extensions.http(('POST','https://wvkjainfwsyiyfcmbtid.supabase.co/functions/v1/facodi-suggestion-analysis',array[extensions.http_header('x-facodi-worker-secret',k)],'application/json','{"kf_private_av":true,"dry_run":{"title":""}}')::extensions.http_request);
 if r.status not in (200,202) then raise exception 'Private AV dispatch failed HTTP %',r.status; end if;
 b:=r.content::jsonb;
 if b->>'reason' not in ('claimed','completed','busy','running','daily_limit','circuit_open','empty') or b->>'reason' is null then raise exception 'Unexpected private AV acknowledgment'; end if;
 return jsonb_build_object('reason',b->>'reason','job_id',b->'job_id','http_status',r.status);
end $$;
revoke all on function facodi.kf_dispatch_private_av_v2() from public,anon,authenticated,service_role;
