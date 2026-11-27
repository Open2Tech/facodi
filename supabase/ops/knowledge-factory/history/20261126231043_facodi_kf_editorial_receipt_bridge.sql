create table if not exists facodi.kf_bridge_receipts (
 id uuid primary key default gen_random_uuid(),
 source_task_id integer not null,
 event_key text not null unique,
 payload jsonb not null,
 status text not null default 'received' check(status in ('received','reviewed','rejected','applied')),
 created_at timestamptz not null default now()
);
alter table facodi.kf_bridge_receipts enable row level security;
revoke all on facodi.kf_bridge_receipts from public,anon,authenticated,service_role;
grant select,insert,update on facodi.kf_bridge_receipts to service_role;
create table if not exists facodi.kf_bridge_capabilities (
 token_hash text primary key,
 source_task_id integer not null,
 expires_at timestamptz not null,
 enabled boolean not null default true
);
alter table facodi.kf_bridge_capabilities enable row level security;
revoke all on facodi.kf_bridge_capabilities from public,anon,authenticated,service_role;
grant select on facodi.kf_bridge_capabilities to service_role;
create or replace function facodi.kf_receive_editorial_receipt(p_hash text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare tid integer; ev text; result uuid; inserted boolean;
begin
 if p_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok',false,'reason','unauthorized'); end if;
 select source_task_id into tid from facodi.kf_bridge_capabilities where token_hash=p_hash and enabled and expires_at>now();
 if tid is null then return jsonb_build_object('ok',false,'reason','unauthorized'); end if;
 if p_payload->>'_model' is distinct from 'project.task' or p_payload->>'_id' is distinct from tid::text or p_payload->>'_name' is distinct from 'KF · Enviar revisão MRP19 ao Supabase' or jsonb_typeof(p_payload->'description') is distinct from 'string' or length(p_payload->>'description') not between 30 and 16000 then return jsonb_build_object('ok',false,'reason','invalid_payload'); end if;
 ev := 'odoo:edu-facodi:task:'||tid||':mrp19-review-v1';
 insert into facodi.kf_bridge_receipts(source_task_id,event_key,payload) values(tid,ev,jsonb_build_object('description',p_payload->>'description','source','odoo','task_id',tid)) on conflict(event_key) do nothing returning id into result;
 inserted := result is not null;
 if not inserted then select id into result from facodi.kf_bridge_receipts where event_key=ev; end if;
 return jsonb_build_object('ok',true,'receipt_id',result,'inserted',inserted);
end $$;
revoke all on function facodi.kf_receive_editorial_receipt(text,jsonb) from public,anon,authenticated;
grant execute on function facodi.kf_receive_editorial_receipt(text,jsonb) to service_role;
