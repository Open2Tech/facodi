
-- Align Gestión's public unit routes with the existing LESTI and CTeSP convention.
-- The official UC code is the stable public route segment.
UPDATE facodi.curricular_units u SET
 slug=u.code,
 metadata=coalesce(u.metadata,'{}'::jsonb)||
 jsonb_build_object('previous_slug',u.slug,
  'canonical_route_convention','official_uc_code',
  'canonical_path',concat('/courses/gestao/units/',u.code))
FROM facodi.courses c
WHERE u.course_id=c.id AND c.code='LGEST'
 AND u.slug IS DISTINCT FROM u.code
 AND u.code ~ '^[0-9]{8,9}$';
