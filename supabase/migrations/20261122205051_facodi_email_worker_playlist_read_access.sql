-- The pre-existing playlist table never granted the email worker read access.
-- Only the three columns used to authorize and validate queued events are needed.
grant select (id,submitted_by,status) on facodi.playlists to service_role;
