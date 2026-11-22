-- Extend the existing private outbox; no Auth hooks or legacy Tube tables.
alter table facodi.email_outbox alter column playlist_id drop not null;
alter table facodi.email_outbox
  add column suggestion_id uuid references facodi.resource_suggestions(id) on delete cascade,
  add column first_attempt_at timestamptz;
alter table facodi.email_outbox drop constraint email_outbox_template_name_check;
alter table facodi.email_outbox add constraint email_outbox_template_name_check check (template_name in (
  'playlist_received','playlist_approved','playlist_rejected',
  'suggestion_received','suggestion_approved','suggestion_rejected'));
alter table facodi.email_outbox add constraint email_outbox_submission_check check (
  (playlist_id is not null and suggestion_id is null and template_name like 'playlist_%') or
  (playlist_id is null and suggestion_id is not null and template_name like 'suggestion_%'));
create index email_outbox_suggestion_idx on facodi.email_outbox(suggestion_id) where suggestion_id is not null;

create function facodi.enqueue_resource_suggestion_mail()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_event text;
begin
  if TG_OP = 'INSERT' then
    v_event := 'suggestion_received';
  elsif NEW.status is distinct from OLD.status and NEW.status in ('approved','rejected') then
    v_event := 'suggestion_' || NEW.status;
  else
    return NEW;
  end if;
  begin
    insert into facodi.email_outbox(event_key,suggestion_id,recipient_user_id,template_name,event_payload)
    values ('facodi:suggestion:' || NEW.id::text || ':' || v_event ||
      case when TG_OP = 'UPDATE' then ':' || coalesce(NEW.reviewed_at,NEW.updated_at)::text else '' end,
      NEW.id,NEW.submitted_by,v_event,
      jsonb_build_object('title',NEW.title,'status',NEW.status,'review_note',NEW.review_note))
    on conflict (event_key) do nothing;
  exception when others then
    -- Never turn an accepted submission or decision into a failure due to mail.
    raise warning 'FACODI suggestion mail queue unavailable (SQLSTATE %)', SQLSTATE;
  end;
  return NEW;
end;
$$;
revoke all on function facodi.enqueue_resource_suggestion_mail() from public,anon,authenticated;
create trigger facodi_resource_suggestion_mail_events after insert or update of status on facodi.resource_suggestions
for each row execute function facodi.enqueue_resource_suggestion_mail();

-- Delivery is independent of the browser, AI budget and editorial notification settings.
-- Reuse the worker credential already held in Vault; never copy secrets into job definitions.
create function facodi.dispatch_contributor_email(p_dry_run boolean default false)
returns bigint language plpgsql set search_path = '' as $$
declare v_url text; v_secret text;
begin
  if not p_dry_run and not exists (select 1 from facodi.email_outbox
    where (state in ('pending','retry') and next_attempt_at <= now())
       or (state = 'processing' and locked_at < now() - interval '15 minutes')) then
    return null;
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'facodi_project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'facodi_suggestion_worker_secret';
  if v_url is null or v_secret is null then
    raise warning 'FACODI contributor email worker is not configured in Vault';
    return null;
  end if;
  return net.http_post(url := v_url || '/functions/v1/facodi-email-notifications',
    headers := jsonb_build_object('Content-Type','application/json','x-facodi-worker-secret',v_secret),
    body := jsonb_build_object('dry_run',p_dry_run),timeout_milliseconds := 5000);
end;
$$;
revoke all on function facodi.dispatch_contributor_email(boolean) from public,anon,authenticated;
select cron.schedule('facodi-contributor-email','* * * * *','select facodi.dispatch_contributor_email();');

-- Historical suggestions are deliberately not backfilled: activation must not send a bulk mailout.
