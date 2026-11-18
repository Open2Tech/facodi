-- Schema already applied via Supabase MCP on 2026-11-18; idempotent for future environments.
-- "Did this help?" on a resource: one private answer per learner and resource.
-- Learners read and change only their own answer; editors read all answers to review the curation
-- (videos with many "no" answers are candidates for replacement). No public read.

create table if not exists facodi.resource_feedback (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  learning_object_id uuid not null references facodi.learning_objects (id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, learning_object_id)
);

comment on table facodi.resource_feedback is
  'Learner answer to "did this resource help?". Owner-only write; owners and FACODI editors read.';

create index if not exists resource_feedback_learning_object_idx on facodi.resource_feedback (learning_object_id);

drop trigger if exists resource_feedback_set_updated_at on facodi.resource_feedback;
create trigger resource_feedback_set_updated_at
  before update on facodi.resource_feedback
  for each row execute function facodi.set_updated_at();

alter table facodi.resource_feedback enable row level security;

drop policy if exists "Owners and editors read resource feedback" on facodi.resource_feedback;
create policy "Owners and editors read resource feedback" on facodi.resource_feedback
  for select to authenticated
  using ((select auth.uid()) = owner_id or (select facodi.is_facodi_editor()));

drop policy if exists "Owners add their resource feedback" on facodi.resource_feedback;
create policy "Owners add their resource feedback" on facodi.resource_feedback
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners change their resource feedback" on facodi.resource_feedback;
create policy "Owners change their resource feedback" on facodi.resource_feedback
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners remove their resource feedback" on facodi.resource_feedback;
create policy "Owners remove their resource feedback" on facodi.resource_feedback
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on facodi.resource_feedback from public, anon, authenticated;
grant select, insert, update, delete on facodi.resource_feedback to authenticated;
