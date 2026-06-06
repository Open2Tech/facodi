GRANT USAGE ON SCHEMA facodi TO service_role;

GRANT SELECT ON
  facodi.v_catalog_courses,
  facodi.v_catalog_units,
  facodi.v_catalog_playlists,
  facodi.v_public_videos,
  facodi.v_playlist_videos,
  facodi.v_admin_video_classifications
TO service_role;