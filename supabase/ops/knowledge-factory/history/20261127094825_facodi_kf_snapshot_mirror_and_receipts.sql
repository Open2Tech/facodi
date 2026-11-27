do $migration$ declare s text; begin
select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
s:=replace(s,'''schema_version'',1,','''schema_version'',1,
    ''mirror_channels'',(select count(*) from facodi.kf_odoo_mirror_channels_v1),
    ''mirror_channels_published'',(select count(*) from facodi.kf_odoo_mirror_channels_v1 d join facodi.kf_odoo_mirror_state m on m.external_id=d.external_id and m.active and m.released),
    ''mirror_slides_expected'',(select count(*) from facodi.kf_odoo_mirror_slides_v1),
    ''mirror_slides_synced'',(select count(*) from facodi.kf_odoo_mirror_slides_v1 d join facodi.kf_odoo_mirror_state m on m.external_id=d.external_id and m.active),
    ''receipts_received'',(select count(*) from facodi.kf_bridge_receipts where status=''received''),
    ''receipts_reviewed'',(select count(*) from facodi.kf_bridge_receipts where status=''reviewed''),
    ''receipts_applied'',(select count(*) from facodi.kf_bridge_receipts where status=''applied''),
    ''receipts_rejected'',(select count(*) from facodi.kf_bridge_receipts where status=''rejected''),
    ''drafts_assembled'',(select count(*) from facodi.kf_bridge_receipts where payload->>''assembly_state''=''draft_assembled''),');
if position('mirror_slides_expected' in s)=0 then raise exception 'Unexpected snapshot definition'; end if;
execute s; end $migration$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
