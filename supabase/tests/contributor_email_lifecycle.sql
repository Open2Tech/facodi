-- Run as postgres in the FACODI database. All fixtures roll back; no email is sent.
begin;
do $$
declare
  v_user uuid;
  v_id uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_url text;
  v_duplicate_url text;
begin
  select id into v_user from auth.users where email = 'test-fun@monynha.com';
  if v_user is null then raise exception 'Configured FACODI test account is missing'; end if;
  v_url := 'https://example.com/facodi-mail-test-' || v_id::text;
  insert into facodi.resource_suggestions(id,submitted_by,url,canonical_url,title,license_declared,attribution_declared)
  values (v_id,v_user,v_url,v_url,'Transactional mail test',true,true);
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id and template_name='suggestion_received' and recipient_user_id=v_user) <> 1 then
    raise exception 'Submission must queue exactly one thank-you for its real author';
  end if;
  update facodi.resource_suggestions set title='Updated test title' where id=v_id;
  update facodi.resource_suggestions set status='pending' where id=v_id;
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id) <> 1 then
    raise exception 'Metadata-only changes must not create another email';
  end if;
  update facodi.resource_suggestions set status='approved',review_note='Editorial review',reviewed_at=now(),reviewed_by=v_user where id=v_id;
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id and template_name='suggestion_approved' and event_payload->>'review_note'='Editorial review') <> 1 then
    raise exception 'Editorial approval must queue the result and review note';
  end if;
  update facodi.resource_suggestions set status='approved' where id=v_id;
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id) <> 2 then
    raise exception 'Same-state updates must not send duplicates';
  end if;
  -- The automatic analysis publisher sets no reviewer, but must still notify the author.
  update facodi.resource_suggestions set status='pending' where id=v_id;
  update facodi.resource_suggestions set status='approved',reviewed_by=null,reviewed_at=now()+interval '1 second' where id=v_id;
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id and template_name='suggestion_approved') <> 2 then
    raise exception 'Automatic approval must queue a result';
  end if;
  update facodi.resource_suggestions set status='rejected',review_note='Not suitable',reviewed_at=now()+interval '2 seconds' where id=v_id;
  if (select count(*) from facodi.email_outbox where suggestion_id=v_id and template_name='suggestion_rejected') <> 1 then
    raise exception 'Rejection must queue a result';
  end if;
  select source_url into v_duplicate_url from facodi.learning_objects where source_url like 'https://%' limit 1;
  if v_duplicate_url is null then raise exception 'Public catalog fixture missing'; end if;
  insert into facodi.resource_suggestions(id,submitted_by,url,canonical_url,title,license_declared,attribution_declared)
  values (v_other,v_user,v_duplicate_url,v_duplicate_url,'Duplicate screening mail test',true,true);
  if (select status from facodi.resource_suggestions where id=v_other) <> 'duplicate'
    or (select count(*) from facodi.email_outbox where suggestion_id=v_other) <> 1 then
    raise exception 'Automatic duplicate screening must only send a thank-you, not a review decision';
  end if;
  if has_table_privilege('anon','facodi.email_outbox','SELECT')
    or has_table_privilege('authenticated','facodi.email_outbox','SELECT')
    or has_function_privilege('authenticated','facodi.enqueue_resource_suggestion_mail()','EXECUTE')
    or has_function_privilege('anon','facodi.dispatch_contributor_email(boolean)','EXECUTE') then
    raise exception 'Mail internals must not be exposed through the Data API';
  end if;
  if not has_column_privilege('service_role','facodi.playlists','submitted_by','SELECT') then
    raise exception 'Worker must be able to validate playlist authors';
  end if;
end;
$$;
rollback;
select 'Contributor mail trigger assertions passed; fixtures rolled back' as result;
