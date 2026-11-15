-- Canonical domain for public FACODI-only project records after Vercel DNS move.
UPDATE facodi.project_profiles
SET website_url=replace(website_url,'https://facodi.vercel.app','https://www.facodi.com'),
    updated_at=now()
WHERE slug IN ('learners','educators')
  AND website_url LIKE 'https://facodi.vercel.app%';