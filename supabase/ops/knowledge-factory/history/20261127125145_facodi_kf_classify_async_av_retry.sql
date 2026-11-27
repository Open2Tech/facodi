do $migration$
declare
  finish_sql text;
  claim_sql text;
  failure_branch text := $branch$else outcome:='request_failed';v:='{}'::jsonb; end if;$branch$;
  claim_condition text := $condition$and a.result_payload->'kf_av_async'->>'http_status' in ('502', '503', '504')$condition$;
  legacy_condition text := $legacy$      or (
        a.result_payload->'kf_av_review'->>'outcome' = 'request_failed'
        and a.result_payload->'kf_av_review'->>'http_status' ~ '^5[0-9]{2}$'
      )$legacy$;
begin
  select pg_get_functiondef('facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb)'::regprocedure)
    into finish_sql;
  select pg_get_functiondef('facodi.kf_claim_private_av_v2()'::regprocedure)
    into claim_sql;

  if position(failure_branch in finish_sql) = 0 or position(claim_condition in claim_sql) = 0
     or position(legacy_condition in claim_sql) = 0 then
    raise exception 'Unexpected KF private audiovisual worker definition';
  end if;

  -- The worker returns HTTP 502 for several different causes. Persist only
  -- the retry verdict derived from known provider errors.
  finish_sql := replace(finish_sql, failure_branch, $branch$
  else
    outcome := 'request_failed';
    v := jsonb_build_object('retryable', coalesce(p_status = 502 and (
      p_result->>'error' = 'ai_timeout'
      or (
        p_result->>'error' = 'ai_unavailable'
        and p_result->>'message' ~ '^AI HTTP 5[0-9]{2}( |$)'
      )
    ), false));
  end if;$branch$);
  claim_sql := replace(claim_sql, claim_condition,
    $condition$and a.result_payload->'kf_av_async'->>'retryable' = 'true'$condition$);
  claim_sql := replace(claim_sql, legacy_condition, '');

  execute finish_sql;
  execute claim_sql;
end
$migration$;

revoke all on function facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb) from public, anon, authenticated, service_role;
revoke all on function facodi.kf_claim_private_av_v2() from public, anon, authenticated, service_role;
grant execute on function facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb) to service_role;
grant execute on function facodi.kf_claim_private_av_v2() to service_role;
