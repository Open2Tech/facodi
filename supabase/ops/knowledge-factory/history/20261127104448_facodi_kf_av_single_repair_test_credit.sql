do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_claim_private_av_v2()'::regprocedure) into s;
s:=replace(s,'''attempt_date''=(now() at time zone ''UTC'')::date::text) then','''attempt_date''=(now() at time zone ''UTC'')::date::text and not (result_payload->''kf_av_async''->>''outcome''=''request_failed'' and coalesce(result_payload->''kf_av_async''->>''repair_test_credit'',''false'')=''true'')) then');
if position('repair_test_credit' in s)=0 then raise exception 'Unexpected claim definition'; end if; execute s;
end $m$;
