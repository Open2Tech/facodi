do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_review_v2_classification_v1(uuid,text,uuid,uuid,uuid,text)'::regprocedure) into s;
if position('if p_action not in' in s)=0 then raise exception 'Unexpected review contract'; end if;
s:=replace(s,'if p_action not in','if p_action is null or p_action not in'); execute s; end $m$;
