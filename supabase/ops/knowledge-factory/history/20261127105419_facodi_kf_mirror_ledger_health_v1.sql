create or replace function facodi.kf_mirror_health_v1() returns jsonb
language sql stable security invoker set search_path='' as $$
with desired_slides as materialized (
 select d.external_id,d.channel_key,encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content,'public-preview-v1')::text,'UTF8')),'hex') content_hash from facodi.kf_odoo_mirror_slides_v1 d
), desired_channels as materialized (
 select d.external_id,encode(sha256(convert_to(jsonb_build_array(d.title,d.description)::text,'UTF8')),'hex') content_hash from facodi.kf_odoo_mirror_channels_v1 d
), slide_state as materialized (
 select d.external_id,d.channel_key,case when s.external_id is null or not s.active then 'missing' when s.content_hash is distinct from d.content_hash or s.model<>'slide.slide' or s.channel_key is distinct from d.channel_key then 'drift' when s.remote_id is null or not s.released then 'unverified' else 'matched' end state
 from desired_slides d left join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id
), channel_state as materialized (
 select d.external_id,coalesce(s.active and s.released and s.model='slide.channel',false) published,
 coalesce(s.active and s.model='slide.channel' and s.remote_id is not null and s.content_hash=d.content_hash,false) matched
 from desired_channels d left join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id
), counts as (
 select channel_key,count(*) total,count(*) filter(where state='matched') matched from slide_state group by channel_key
)
select jsonb_build_object(
 'scope','local_ledger_not_remote_readback',
 'slides',jsonb_build_object('desired',(select count(*) from slide_state),'matched',(select count(*) from slide_state where state='matched'),'missing',(select count(*) from slide_state where state='missing'),'drift',(select count(*) from slide_state where state='drift'),'unverified',(select count(*) from slide_state where state='unverified'),'obsolete_active',(select count(*) from facodi.kf_odoo_mirror_state m where m.model='slide.slide' and m.active and not exists(select 1 from desired_slides d where d.external_id=m.external_id))),
 'channels',jsonb_build_object('desired',(select count(*) from channel_state),'published',(select count(*) from channel_state where published),'fully_matched',(select count(*) from channel_state c join counts s on s.channel_key=c.external_id where c.matched and c.published and s.total=s.matched),'published_incomplete',(select count(*) from channel_state c left join counts s on s.channel_key=c.external_id where c.published and (not c.matched or coalesce(s.total,0)=0 or s.total<>s.matched)),'obsolete_active',(select count(*) from facodi.kf_odoo_mirror_state m where m.model='slide.channel' and m.active and not exists(select 1 from desired_channels d where d.external_id=m.external_id))),
 'remote_id_duplicates',(select count(*) from (select model,remote_id from facodi.kf_odoo_mirror_state where active and remote_id is not null group by model,remote_id having count(*)>1) duplicates),
 'observed_at',now()
);
$$;
revoke all on function facodi.kf_mirror_health_v1() from public,anon,authenticated,service_role;
