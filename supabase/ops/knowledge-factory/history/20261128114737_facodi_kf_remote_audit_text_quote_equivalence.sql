create or replace function facodi.kf_mirror_expected_html_v1(p_html text) returns text language sql immutable strict security invoker set search_path='' as $$
with pieces as (select m[1] piece, ord from regexp_matches(p_html,'(<[^>]*>|[^<]+)','g') with ordinality t(m,ord))
select case when string_agg(piece,'' order by ord)=p_html then string_agg(case when left(piece,1)='<' then piece else replace(piece,'&quot;','"') end,'' order by ord) else p_html end from pieces
$$;
revoke all on function facodi.kf_mirror_expected_html_v1(text) from public,anon,authenticated,service_role;
do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_audit_odoo_slides_v1(integer)'::regprocedure) into s;
if position('if x->>''html_content'' is distinct from e->>''html_content'' then' in s)=0 then raise exception 'Unexpected audit comparator'; end if;
s:=replace(s,'if x->>''html_content'' is distinct from e->>''html_content'' then','if x->>''html_content'' is distinct from e->>''html_content'' and x->>''html_content'' is distinct from facodi.kf_mirror_expected_html_v1(e->>''html_content'') then');
s:=replace(s,'''exact_remote_article_fields''','''remote_article_fields_text_quote_normalized''');execute s;
select pg_get_functiondef('facodi.kf_mirror_slide_audit_health_v1()'::regprocedure) into s;s:=replace(s,'''exact_remote_article_fields''','''remote_article_fields_text_quote_normalized''');execute s;
end $m$;
update facodi.kf_mirror_slide_audit set expected_hash='recheck:quote-serialization-v1' where outcome='mismatch' and differences=array['html'];
select cron.alter_job(16,schedule:='17,27,37 4 * * *');
