-- FACODI-only transactional email outbox. Does not alter shared Supabase Auth.
-- Events are queued from real playlist submissions and editorial decisions.
CREATE TABLE IF NOT EXISTS facodi.email_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_key text NOT NULL UNIQUE,
 playlist_id uuid NOT NULL REFERENCES facodi.playlists(id) ON DELETE CASCADE,
 recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 template_name text NOT NULL CHECK (template_name IN ('playlist_received','playlist_approved','playlist_rejected')),
 event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','retry','sent','failed','skipped')),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz,
 provider_message_id text,
 failure_code text,
 sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS facodi_email_outbox_ready_idx
 ON facodi.email_outbox(next_attempt_at,created_at)
 WHERE state IN ('pending','retry');
CREATE INDEX IF NOT EXISTS facodi_email_outbox_recipient_idx
 ON facodi.email_outbox(recipient_user_id,created_at DESC);

ALTER TABLE facodi.email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.email_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON facodi.email_outbox TO service_role;

CREATE OR REPLACE FUNCTION facodi.enqueue_playlist_mail()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,facodi AS $$
DECLARE ev text;
BEGIN
 IF TG_OP='INSERT' THEN
   ev:='playlist_received';
 ELSIF TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND
       NEW.status IN ('approved','rejected') THEN
   ev:='playlist_'||NEW.status;
 ELSE
   RETURN NEW;
 END IF;
 BEGIN
  INSERT INTO facodi.email_outbox(event_key,playlist_id,recipient_user_id,template_name,event_payload)
  VALUES (
    'facodi:'||NEW.id::text||':'||ev||
      CASE WHEN TG_OP='UPDATE' THEN ':'||to_char(NEW.updated_at AT TIME ZONE 'UTC','YYYYMMDDHH24MISSUS') ELSE '' END,
    NEW.id,NEW.submitted_by,ev,
    jsonb_build_object('playlist_title',NEW.title,'status',NEW.status,
      'review_note',NEW.review_note,'course_id',NEW.course_id,'unit_id',NEW.curricular_unit_id)
  )
  ON CONFLICT(event_key) DO NOTHING;
 EXCEPTION WHEN OTHERS THEN
  -- Notification outage must never invalidate a valid playlist submission/review.
  RAISE WARNING 'FACODI mail queue unavailable (SQLSTATE %)', SQLSTATE;
 END;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION facodi.enqueue_playlist_mail() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS facodi_playlist_mail_events ON facodi.playlists;
CREATE TRIGGER facodi_playlist_mail_events
 AFTER INSERT OR UPDATE OF status ON facodi.playlists
 FOR EACH ROW EXECUTE FUNCTION facodi.enqueue_playlist_mail();

DO $checks$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='facodi'
   AND tablename='email_outbox') THEN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='facodi_playlist_mail_events'
   AND tgrelid='facodi.playlists'::regclass AND tgenabled='O') THEN
   RAISE EXCEPTION 'Queue trigger missing';
 END IF;
END $checks$;