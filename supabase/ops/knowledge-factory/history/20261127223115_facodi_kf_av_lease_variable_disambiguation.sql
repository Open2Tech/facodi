do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_claim_private_av_v2()'::regprocedure) into s;
if position('lease_token uuid := gen_random_uuid()' in s)=0 then raise exception 'Unexpected lease definition'; end if;
s:=replace(s,'lease_token uuid := gen_random_uuid()','v_lease_token uuid := gen_random_uuid()');
s:=replace(s,'''lease_token'', lease_token','''lease_token'', v_lease_token');
s:=replace(s,'attempt_date text :=','v_attempt_date text :=');
s:=replace(s,'->>''attempt_date'' = attempt_date','->>''attempt_date'' = v_attempt_date');
s:=replace(s,'''attempt_date'', attempt_date','''attempt_date'', v_attempt_date');
execute s; end $m$;
