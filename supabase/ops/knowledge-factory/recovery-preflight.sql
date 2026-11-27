-- Read-only inventory for an empty, restored, or running database.
with relations(stage, name) as (
  values
    ('platform', 'cron.job'),
    ('platform', 'cron.job_run_details'),
    ('platform', 'vault.decrypted_secrets'),
    ('catalog', 'facodi.analysis_job_events'),
    ('catalog', 'facodi.analysis_jobs'),
    ('catalog', 'facodi.courses'),
    ('catalog', 'facodi.curricular_units'),
    ('catalog', 'facodi.learning_object_relations'),
    ('catalog', 'facodi.learning_objects'),
    ('catalog', 'facodi.resource_suggestions'),
    ('catalog', 'facodi.unit_videos'),
    ('catalog', 'facodi.video_classifications'),
    ('catalog', 'facodi.youtube_videos'),
    ('kf', 'facodi.kf_bridge_capabilities'),
    ('kf', 'facodi.kf_bridge_receipts'),
    ('kf', 'facodi.kf_mrp_evidence_manifest'),
    ('kf', 'facodi.kf_odoo_mirror_channels_v1'),
    ('kf', 'facodi.kf_odoo_mirror_slides_v1'),
    ('kf', 'facodi.kf_odoo_mirror_state'),
    ('kf', 'facodi.kf_release_authorizations')
),
routines(stage, name) as (
  values
    ('platform', 'extensions.http(extensions.http_request)'),
    ('platform', 'extensions.unaccent(text)'),
    ('catalog', 'facodi.queue_analysis_job(text,uuid,uuid,text,text,uuid,text,jsonb,text)'),
    ('catalog', 'facodi.rank_resource_suggestion_units(text,uuid,uuid,integer)'),
    ('kf', 'facodi.kf_claim_private_av_v2()'),
    ('kf', 'facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb)'),
    ('kf', 'facodi.kf_dispatch_private_av_v2()'),
    ('kf', 'facodi.kf_receive_editorial_receipt(text,jsonb)'),
    ('kf', 'facodi.kf_release_bom_revision(text,jsonb)'),
    ('kf', 'facodi.kf_mrp_resource_av_assurance_v1()'),
    ('kf', 'facodi.kf_mirror_health_v1()'),
    ('kf', 'facodi.kf_push_operational_snapshot()'),
    ('kf', 'facodi.kf_run_approved_release_queue_v1()'),
    ('kf', 'facodi.kf_run_lesson_assembly_v1()'),
    ('kf', 'facodi.kf_run_odoo_elearning_sync_v1()'),
    ('kf', 'facodi.kf_run_outbox_sync_v1()'),
    ('kf', 'facodi.kf_check_public_course_structure_v1()')
),
roles(name) as (values ('anon'), ('authenticated'), ('service_role')),
checks as (
  select stage, 'relation' as kind, name, to_regclass(name) is not null as present from relations
  union all
  select stage, 'routine', name,
    case when to_regnamespace(split_part(name, '.', 1)) is not null
      and (name <> 'extensions.http(extensions.http_request)'
        or to_regtype('extensions.http_request') is not null)
    then to_regprocedure(name) is not null else false end
  from routines
  union all
  select 'platform', 'role', roles.name, pg_roles.oid is not null
  from roles left join pg_roles on pg_roles.rolname = roles.name
)
select stage, count(*) as expected, count(*) filter (where present) as present,
  coalesce(array_agg(kind || ': ' || name order by kind, name) filter (where not present), '{}') as missing
from checks
group by stage
order by case stage when 'platform' then 1 when 'catalog' then 2 else 3 end;
