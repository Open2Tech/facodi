-- FACODI-only branded email catalog. NOT a Supabase Auth mailer configuration.
-- This catalog cannot dispatch emails and deliberately isolates the Tube's shared Auth templates.
CREATE TABLE IF NOT EXISTS facodi.email_template_catalog (
  template_key text NOT NULL CHECK (template_key ~ '^[a-z_]{3,60}$'),
  locale text NOT NULL DEFAULT 'pt-PT' CHECK(locale in ('pt-PT')),
  audience text NOT NULL DEFAULT 'facodi' CHECK (audience='facodi'),
  subject text NOT NULL CHECK (char_length(subject) between 8 and 200),
  body_html text NOT NULL CHECK (char_length(body_html) between 300 and 20000),
  template_source_path text NOT NULL CHECK (template_source_path LIKE 'supabase/email-templates/facodi/%.html'),
  site_origin text NOT NULL DEFAULT 'https://www.facodi.com' CHECK(site_origin='https://www.facodi.com'),
  delivery_enabled boolean NOT NULL DEFAULT false CHECK (delivery_enabled=false),
  review_status text NOT NULL DEFAULT 'ready' CHECK (review_status in ('draft','ready')),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(template_key, locale)
);
ALTER TABLE facodi.email_template_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.email_template_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON facodi.email_template_catalog TO authenticated;
CREATE POLICY facodi_email_template_editor_read
 ON facodi.email_template_catalog FOR SELECT TO authenticated
 USING((SELECT facodi.is_facodi_editor()));
COMMENT ON TABLE facodi.email_template_catalog
 IS 'Versioned FACODI-only preview catalog. Supabase hosted Auth uses project-global templates, not this table. No emails can be dispatched from this table.';