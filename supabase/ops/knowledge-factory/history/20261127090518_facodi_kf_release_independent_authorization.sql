create table if not exists facodi.kf_release_authorizations (
 receipt_id uuid primary key references facodi.kf_bridge_receipts(id),
 payload_hash text not null check(payload_hash ~ '^[0-9a-f]{64}$'),
 authorized_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 check(expires_at>authorized_at)
);
alter table facodi.kf_release_authorizations enable row level security;
revoke all on facodi.kf_release_authorizations from public,anon,authenticated,service_role;
do $migration$
declare s text;
begin
 select pg_get_functiondef('facodi.kf_run_approved_release_queue_v1()'::regprocedure) into s;
 s:=replace(s,'and payload->>''release_authorization''=''editorial_admin'' order by','and payload->>''release_authorization''=''editorial_admin'' and exists(select 1 from facodi.kf_release_authorizations a where a.receipt_id=kf_bridge_receipts.id and a.revoked_at is null and a.expires_at>now() and a.payload_hash=encode(sha256(convert_to(kf_bridge_receipts.payload::text,''UTF8'')),''hex'')) order by');
 if position('kf_release_authorizations' in s)=0 then raise exception 'Unexpected queue definition'; end if;
 execute s;
end $migration$;
revoke all on function facodi.kf_run_approved_release_queue_v1() from public,anon,authenticated,service_role;
