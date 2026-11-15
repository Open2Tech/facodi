-- FACODI Auth email *catalogue* only. Auth mailer templates remain global/shared.
-- Applied directly to Supabase project wvkjainfwsyiyfcmbtid on 2026-11-15.
-- Keep this migration identical to the remote, version 20261115174921.
BEGIN;
ALTER TABLE facodi.email_template_catalog
  DROP CONSTRAINT email_template_catalog_site_origin_check;
UPDATE facodi.email_template_catalog
SET site_origin = 'https://facodi.com',
    body_html = replace(replace(body_html,
      'https://www.facodi.com', 'https://facodi.com'),
      'https://facodi.vercel.app', 'https://facodi.com'),
    version = version + 1,
    updated_at = now()
WHERE audience = 'facodi' AND locale = 'pt-PT'
  AND (site_origin <> 'https://facodi.com'
    OR body_html LIKE '%https://www.facodi.com%'
    OR body_html LIKE '%https://facodi.vercel.app%');
ALTER TABLE facodi.email_template_catalog
  ADD CONSTRAINT email_template_catalog_site_origin_check
  CHECK (site_origin = 'https://facodi.com');
COMMIT;
