-- Users control their own non-public volunteer interest records.
-- Deletion never affects academic enrollment or published resources.
GRANT DELETE ON facodi.community_participation_requests TO authenticated;
CREATE POLICY "facodi_community_author_erase"
ON facodi.community_participation_requests
FOR DELETE TO authenticated
USING (submitted_by=(SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL);
COMMENT ON POLICY "facodi_community_author_erase"
ON facodi.community_participation_requests
IS 'Contributor may withdraw and erase their own private expression of interest without administrative or email interaction.';