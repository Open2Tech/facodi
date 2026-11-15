-- Archive supports non-European credit systems without forging ECTS.
ALTER TABLE facodi.course_curriculum_archives
 ALTER COLUMN programme_ects DROP NOT NULL;