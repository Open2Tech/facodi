create table if not exists facodi.kf_mrp_evidence_manifest (
 receipt_id uuid primary key references facodi.kf_bridge_receipts(id),
 task_id integer not null check(task_id>0),
 recipe_code text not null check(recipe_code='KF-BOM-RESOURCE'),
 product_code text not null check(product_code='KF-RESOURCE'),
 expected_qty integer not null check(expected_qty between 1 and 20),
 evidence_hash text not null check(evidence_hash ~ '^[0-9a-f]{64}$'),
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
alter table facodi.kf_mrp_evidence_manifest enable row level security;
revoke all on facodi.kf_mrp_evidence_manifest from public,anon,authenticated,service_role;
create or replace function facodi.kf_mrp_source_evidence_v1()
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare m record; result jsonb:='[]'::jsonb; valid integer; items jsonb;
begin
 for m in select a.*,r.payload,r.status,r.source_task_id from facodi.kf_mrp_evidence_manifest a join facodi.kf_bridge_receipts r on r.id=a.receipt_id where a.enabled order by a.task_id,a.receipt_id limit 20 loop
  if m.status<>'received' or m.source_task_id<>m.task_id or m.payload->>'contract' is distinct from 'resource_source_evidence.v1' or m.payload->>'source' is distinct from 'supabase_oembed_verified' or m.payload->'gates' is distinct from '["source_identity","minimum_metadata"]'::jsonb or m.evidence_hash is distinct from encode(sha256(convert_to(m.payload::text,'UTF8')),'hex') then continue; end if;
  items:=m.payload->'items';
  if jsonb_typeof(items) is distinct from 'array' then continue; end if;
  if jsonb_array_length(items)<>m.expected_qty or (select count(distinct x->>'object_id') from jsonb_array_elements(items) x)<>m.expected_qty or (select count(distinct x->>'video_id') from jsonb_array_elements(items) x)<>m.expected_qty then continue; end if;
  select count(*) into valid from jsonb_array_elements(items) x join facodi.learning_objects o on o.id::text=x->>'object_id'
  where o.object_type='video' and o.status='draft' and not o.published and o.language=x->>'language' and o.source_id=x->>'video_id' and o.source_id ~ '^[A-Za-z0-9_-]{11}$' and o.source_url='https://www.youtube.com/watch?v='||o.source_id and o.source_url=x->>'source_url' and o.title=x->>'title'
  and o.metadata->'kf_source_evidence_v1'=x->'source_evidence' and x->'source_evidence'->>'status'='200' and x->'source_evidence'->>'title_match'='true' and x->'source_evidence'->>'title'=o.title and x->'source_evidence'->>'scope'='public_oembed_metadata_only' and nullif(x->'source_evidence'->>'author','') is not null
  and (select count(*) from facodi.learning_objects z where z.source_id=o.source_id or z.source_url=o.source_url)=1
  and not exists(select 1 from facodi.youtube_videos y where (y.youtube_video_id=o.source_id or y.canonical_url=o.source_url) and y.learning_object_id is distinct from o.id);
  if valid<>m.expected_qty then continue; end if;
  result:=result||jsonb_build_array(jsonb_build_object('contract','resource_source_evidence.v1','task_id',m.task_id,'receipt_id',m.receipt_id,'recipe_code',m.recipe_code,'product_code',m.product_code,'count',m.expected_qty,'evidence_hash',m.evidence_hash,'gates',m.payload->'gates'));
 end loop;
 return result;
end $$;
revoke all on function facodi.kf_mrp_source_evidence_v1() from public,anon,authenticated,service_role;
