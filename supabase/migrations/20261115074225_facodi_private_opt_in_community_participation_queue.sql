-- FACODI community: privacy-first opt-in interest forms. No email dispatch.
-- Public read is prohibited: only the author and an editor may inspect a proposal.
CREATE TABLE IF NOT EXISTS facodi.community_participation_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest text NOT NULL CHECK (interest IN
    ('learner','educator','curator','developer','designer','translator','organization')),
  motivation text NOT NULL CHECK (char_length(btrim(motivation)) BETWEEN 30 AND 1200),
  portfolio_url text CHECK (
    portfolio_url IS NULL OR (char_length(portfolio_url)<=500 AND
      portfolio_url ~ '^https://[^[:space:]]+$')),
  consent_to_contact boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'pending' CHECK (
    review_status IN ('pending','accepted','rejected')),
  review_note text CHECK (review_note IS NULL OR char_length(review_note)<=1200),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE facodi.community_participation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.community_participation_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT, INSERT ON facodi.community_participation_requests TO authenticated;
GRANT UPDATE (review_status, review_note) ON facodi.community_participation_requests TO authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS facodi_community_one_pending_interest
  ON facodi.community_participation_requests(submitted_by,interest)
  WHERE review_status='pending';
CREATE INDEX IF NOT EXISTS facodi_community_pending_queue
  ON facodi.community_participation_requests(created_at,id)
  WHERE review_status='pending';
CREATE INDEX IF NOT EXISTS facodi_community_my_history
  ON facodi.community_participation_requests(submitted_by,created_at DESC);
CREATE POLICY "facodi_community_owner_read"
  ON facodi.community_participation_requests FOR SELECT TO authenticated
  USING (submitted_by=(SELECT auth.uid()));
CREATE POLICY "facodi_community_editor_read"
  ON facodi.community_participation_requests FOR SELECT TO authenticated
  USING ((SELECT facodi.is_facodi_editor()));
CREATE POLICY "facodi_community_opt_in_insert"
  ON facodi.community_participation_requests FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by=(SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
    AND consent_to_contact
    AND review_status='pending'
    AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note IS NULL
  );
CREATE POLICY "facodi_community_editor_review"
  ON facodi.community_participation_requests FOR UPDATE TO authenticated
  USING (review_status='pending' AND (SELECT facodi.is_facodi_editor()))
  WITH CHECK ((SELECT facodi.is_facodi_editor()));

CREATE OR REPLACE FUNCTION facodi.validate_community_participation()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $fn$
DECLARE recent_count integer;
BEGIN
  IF TG_OP='INSERT' THEN
    IF (SELECT auth.uid()) IS NULL OR NEW.submitted_by IS DISTINCT FROM (SELECT auth.uid()) THEN
      RAISE EXCEPTION 'Sign-in required for personal participation proposals' USING ERRCODE='42501';
    END IF;
    IF NOT NEW.consent_to_contact OR NEW.review_status<>'pending'
       OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.review_note IS NOT NULL THEN
      RAISE EXCEPTION 'Only new, explicitly opted-in proposals are allowed' USING ERRCODE='22023';
    END IF;
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.submitted_by::text,4721));
    SELECT count(*) INTO recent_count FROM facodi.community_participation_requests
    WHERE submitted_by=NEW.submitted_by AND created_at>now()-interval '7 days';
    IF recent_count>=3 THEN
      RAISE EXCEPTION 'Weekly limit reached (3 requests)' USING ERRCODE='22023';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF (SELECT auth.uid()) IS NULL OR NOT (SELECT facodi.is_facodi_editor()) THEN
      RAISE EXCEPTION 'Only FACODI editors can review proposals' USING ERRCODE='42501';
    END IF;
    IF OLD.review_status<>'pending' OR NEW.review_status NOT IN ('accepted','rejected') THEN
      RAISE EXCEPTION 'Only pending proposals can be reviewed' USING ERRCODE='22023';
    END IF;
    NEW.reviewed_by=(SELECT auth.uid());
    NEW.reviewed_at=now();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$fn$;
DROP TRIGGER IF EXISTS facodi_validate_community_participation
 ON facodi.community_participation_requests;
CREATE TRIGGER facodi_validate_community_participation
BEFORE INSERT OR UPDATE ON facodi.community_participation_requests
FOR EACH ROW EXECUTE FUNCTION facodi.validate_community_participation();
COMMENT ON TABLE facodi.community_participation_requests
  IS 'Opt-in FACODI collaboration interest, not public membership or enrollment. No automatic emails.';