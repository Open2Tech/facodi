do $migration$
declare
  claim_sql text;
  legacy_guard text := $guard$and not (a.result_payload ? 'kf_av_review')$guard$;
  legacy_order text := 'order by o.slug limit 1 for update of a';
begin
  select pg_get_functiondef('facodi.kf_claim_private_av_v2()'::regprocedure)
    into claim_sql;
  if position(legacy_guard in claim_sql) = 0 or position(legacy_order in claim_sql) = 0 then
    raise exception 'Unexpected KF audiovisual claim definition';
  end if;

  -- Only legacy transport errors can enter the existing async queue once.
  -- The separate kf_av_async guard, exclusive lease and daily limit still apply.
  claim_sql := replace(claim_sql, legacy_guard, $eligibility$and (
    not (a.result_payload ? 'kf_av_review')
    or a.result_payload->'kf_av_review'->>'outcome' = 'transport_or_response_error'
    or (
      a.result_payload->'kf_av_review'->>'outcome' = 'request_failed'
      and a.result_payload->'kf_av_review'->>'http_status' ~ '^5[0-9]{2}$'
    )
  )$eligibility$);
  claim_sql := replace(claim_sql, legacy_order,
    $ordering$order by (a.result_payload ? 'kf_av_review'), o.slug limit 1 for update of a$ordering$);
  execute claim_sql;
end
$migration$;

revoke all on function facodi.kf_claim_private_av_v2() from public, anon, authenticated;
grant execute on function facodi.kf_claim_private_av_v2() to service_role;
