-- FACODI backend v2
-- Rebuilds only the facodi schema. Other schemas are intentionally untouched.

DROP SCHEMA IF EXISTS facodi CASCADE;
CREATE SCHEMA facodi;

COMMENT ON SCHEMA facodi IS 'FACODI v2 academic knowledge base and video classification backend.';

CREATE TABLE facodi.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_source TEXT NOT NULL DEFAULT 'odoo',
  external_id TEXT NOT NULL,
  odoo_channel_id INTEGER,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  summary TEXT,
  description_html TEXT,
  degree_type TEXT,
  language TEXT DEFAULT 'pt',
  school TEXT,
  source_url TEXT,
  plan_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  published BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (external_source, external_id),
  UNIQUE (slug)
);

CREATE TABLE facodi.curricular_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES facodi.courses(id) ON DELETE CASCADE,
  external_source TEXT NOT NULL DEFAULT 'odoo',
  external_id TEXT NOT NULL,
  odoo_slide_id INTEGER,
  code TEXT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  summary TEXT,
  description_html TEXT,
  curricular_year INTEGER CHECK (curricular_year IS NULL OR curricular_year BETWEEN 1 AND 8),
  semester INTEGER CHECK (semester IS NULL OR semester BETWEEN 1 AND 3),
  ects NUMERIC(5,2) CHECK (ects IS NULL OR (ects > 0 AND ects <= 90)),
  language TEXT DEFAULT 'pt',
  official_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, external_source, external_id),
  UNIQUE (course_id, slug)
);

CREATE TABLE facodi.taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE facodi.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_id UUID NOT NULL REFERENCES facodi.taxonomies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES facodi.terms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (taxonomy_id, normalized_name, language)
);

CREATE TABLE facodi.course_terms (
  course_id UUID NOT NULL REFERENCES facodi.courses(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES facodi.terms(id) ON DELETE CASCADE,
  weight NUMERIC(5,4) NOT NULL DEFAULT 1 CHECK (weight >= 0 AND weight <= 1),
  source TEXT NOT NULL DEFAULT 'system'
    CHECK (source IN ('official', 'odoo', 'llm', 'editor', 'system', 'extracted')),
  confidence NUMERIC(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, term_id)
);

CREATE TABLE facodi.curricular_unit_terms (
  curricular_unit_id UUID NOT NULL REFERENCES facodi.curricular_units(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES facodi.terms(id) ON DELETE CASCADE,
  weight NUMERIC(5,4) NOT NULL DEFAULT 1 CHECK (weight >= 0 AND weight <= 1),
  source TEXT NOT NULL DEFAULT 'system'
    CHECK (source IN ('official', 'odoo', 'llm', 'editor', 'system', 'extracted')),
  confidence NUMERIC(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (curricular_unit_id, term_id)
);

CREATE TABLE facodi.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'curricular_unit', 'video')),
  course_id UUID REFERENCES facodi.courses(id) ON DELETE CASCADE,
  curricular_unit_id UUID REFERENCES facodi.curricular_units(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('odoo_channel', 'odoo_slide', 'official_pdf', 'youtube_metadata', 'youtube_transcript', 'editorial')),
  source_url TEXT,
  title TEXT,
  content_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (entity_type = 'course' AND course_id IS NOT NULL AND curricular_unit_id IS NULL)
    OR (entity_type = 'curricular_unit' AND curricular_unit_id IS NOT NULL)
    OR (entity_type = 'video')
  )
);

CREATE TABLE facodi.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES facodi.knowledge_sources(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'curricular_unit')),
  course_id UUID REFERENCES facodi.courses(id) ON DELETE CASCADE,
  curricular_unit_id UUID REFERENCES facodi.curricular_units(id) ON DELETE CASCADE,
  chunk_type TEXT NOT NULL DEFAULT 'body'
    CHECK (chunk_type IN ('summary', 'description', 'learning_outcome', 'syllabus', 'assessment', 'bibliography', 'body')),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content_text TEXT NOT NULL,
  content_tokens INTEGER,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, chunk_type, chunk_index),
  CHECK (
    (entity_type = 'course' AND course_id IS NOT NULL AND curricular_unit_id IS NULL)
    OR (entity_type = 'curricular_unit' AND curricular_unit_id IS NOT NULL)
  )
);

CREATE TABLE facodi.youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id TEXT NOT NULL UNIQUE,
  canonical_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  channel_id TEXT,
  channel_title TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  published_at TIMESTAMPTZ,
  thumbnails JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  language TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'metadata_ready', 'content_ready', 'embedded', 'classified', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE facodi.video_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES facodi.youtube_videos(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN ('metadata', 'description', 'transcript', 'captions', 'chapters', 'comments', 'clean_text')),
  content_text TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT,
  source TEXT NOT NULL DEFAULT 'system'
    CHECK (source IN ('youtube_api', 'transcript_api', 'llm', 'editor', 'system')),
  content_hash TEXT,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, artifact_type, source, content_hash)
);

CREATE TABLE facodi.analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES facodi.youtube_videos(id) ON DELETE SET NULL,
  youtube_video_id TEXT,
  input_url TEXT,
  job_type TEXT NOT NULL DEFAULT 'classify_youtube_video'
    CHECK (job_type IN ('classify_youtube_video', 'sync_course_catalog', 'generate_embeddings')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'needs_review', 'cancelled')),
  current_step TEXT NOT NULL DEFAULT 'created',
  requested_by UUID,
  request_source TEXT NOT NULL DEFAULT 'edge_function',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  error_code TEXT,
  error_message TEXT,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE facodi.model_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES facodi.analysis_jobs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'ollama', 'system')),
  model TEXT NOT NULL,
  purpose TEXT NOT NULL,
  prompt_version TEXT,
  input_hash TEXT,
  input_summary TEXT,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  status TEXT NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('succeeded', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE facodi.classification_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES facodi.analysis_jobs(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES facodi.youtube_videos(id) ON DELETE CASCADE,
  course_id UUID REFERENCES facodi.courses(id) ON DELETE CASCADE,
  curricular_unit_id UUID REFERENCES facodi.curricular_units(id) ON DELETE CASCADE,
  candidate_type TEXT NOT NULL CHECK (candidate_type IN ('course', 'curricular_unit')),
  rank INTEGER NOT NULL CHECK (rank > 0),
  vector_score NUMERIC(7,6),
  keyword_score NUMERIC(7,6),
  llm_score NUMERIC(7,6),
  combined_score NUMERIC(7,6),
  confidence NUMERIC(7,6) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  justification TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (candidate_type = 'course' AND course_id IS NOT NULL AND curricular_unit_id IS NULL)
    OR (candidate_type = 'curricular_unit' AND course_id IS NOT NULL AND curricular_unit_id IS NOT NULL)
  ),
  UNIQUE (job_id, candidate_type, course_id, curricular_unit_id)
);

CREATE TABLE facodi.video_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE REFERENCES facodi.analysis_jobs(id) ON DELETE SET NULL,
  video_id UUID NOT NULL REFERENCES facodi.youtube_videos(id) ON DELETE CASCADE,
  course_id UUID REFERENCES facodi.courses(id) ON DELETE SET NULL,
  curricular_unit_id UUID REFERENCES facodi.curricular_units(id) ON DELETE SET NULL,
  model_run_id UUID REFERENCES facodi.model_runs(id) ON DELETE SET NULL,
  confidence NUMERIC(7,6) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  confidence_level TEXT NOT NULL DEFAULT 'low'
    CHECK (confidence_level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'accepted', 'rejected', 'corrected', 'needs_review')),
  needs_review BOOLEAN NOT NULL DEFAULT true,
  justification TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION facodi.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON facodi.courses
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_curricular_units_updated_at
  BEFORE UPDATE ON facodi.curricular_units
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_taxonomies_updated_at
  BEFORE UPDATE ON facodi.taxonomies
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_terms_updated_at
  BEFORE UPDATE ON facodi.terms
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_knowledge_sources_updated_at
  BEFORE UPDATE ON facodi.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_knowledge_chunks_updated_at
  BEFORE UPDATE ON facodi.knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_youtube_videos_updated_at
  BEFORE UPDATE ON facodi.youtube_videos
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_video_artifacts_updated_at
  BEFORE UPDATE ON facodi.video_artifacts
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_analysis_jobs_updated_at
  BEFORE UPDATE ON facodi.analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE TRIGGER set_video_classifications_updated_at
  BEFORE UPDATE ON facodi.video_classifications
  FOR EACH ROW EXECUTE FUNCTION facodi.set_updated_at();

CREATE INDEX idx_facodi_courses_external ON facodi.courses(external_source, external_id);
CREATE INDEX idx_facodi_courses_odoo_channel ON facodi.courses(odoo_channel_id);
CREATE INDEX idx_facodi_courses_published_status ON facodi.courses(published, status);
CREATE INDEX idx_facodi_courses_normalized_title ON facodi.courses(normalized_title);
CREATE INDEX idx_facodi_courses_metadata_gin ON facodi.courses USING gin(metadata);

CREATE INDEX idx_facodi_units_course ON facodi.curricular_units(course_id);
CREATE INDEX idx_facodi_units_external ON facodi.curricular_units(external_source, external_id);
CREATE INDEX idx_facodi_units_odoo_slide ON facodi.curricular_units(odoo_slide_id);
CREATE INDEX idx_facodi_units_code ON facodi.curricular_units(code);
CREATE INDEX idx_facodi_units_year_semester ON facodi.curricular_units(curricular_year, semester);
CREATE INDEX idx_facodi_units_metadata_gin ON facodi.curricular_units USING gin(metadata);

CREATE INDEX idx_facodi_terms_taxonomy ON facodi.terms(taxonomy_id);
CREATE INDEX idx_facodi_terms_normalized_name ON facodi.terms(normalized_name);
CREATE INDEX idx_facodi_course_terms_term ON facodi.course_terms(term_id);
CREATE INDEX idx_facodi_unit_terms_term ON facodi.curricular_unit_terms(term_id);

CREATE INDEX idx_facodi_sources_course ON facodi.knowledge_sources(course_id);
CREATE INDEX idx_facodi_sources_unit ON facodi.knowledge_sources(curricular_unit_id);
CREATE UNIQUE INDEX uq_facodi_sources_course_type
  ON facodi.knowledge_sources(course_id, source_type)
  WHERE entity_type = 'course' AND curricular_unit_id IS NULL;
CREATE UNIQUE INDEX uq_facodi_sources_unit_type
  ON facodi.knowledge_sources(curricular_unit_id, source_type)
  WHERE entity_type = 'curricular_unit';
CREATE INDEX idx_facodi_chunks_source ON facodi.knowledge_chunks(source_id);
CREATE INDEX idx_facodi_chunks_course ON facodi.knowledge_chunks(course_id);
CREATE INDEX idx_facodi_chunks_unit ON facodi.knowledge_chunks(curricular_unit_id);
CREATE INDEX idx_facodi_chunks_text_gin ON facodi.knowledge_chunks USING gin(to_tsvector('portuguese', content_text));
CREATE INDEX idx_facodi_chunks_embedding_hnsw
  ON facodi.knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE INDEX idx_facodi_videos_youtube_id ON facodi.youtube_videos(youtube_video_id);
CREATE INDEX idx_facodi_videos_status ON facodi.youtube_videos(status);
CREATE INDEX idx_facodi_artifacts_video ON facodi.video_artifacts(video_id);
CREATE INDEX idx_facodi_artifacts_type ON facodi.video_artifacts(artifact_type);
CREATE UNIQUE INDEX uq_facodi_artifacts_without_hash
  ON facodi.video_artifacts(video_id, artifact_type, source)
  WHERE content_hash IS NULL;
CREATE INDEX idx_facodi_artifacts_embedding_hnsw
  ON facodi.video_artifacts USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE INDEX idx_facodi_jobs_status ON facodi.analysis_jobs(status, current_step);
CREATE INDEX idx_facodi_jobs_video ON facodi.analysis_jobs(video_id);
CREATE INDEX idx_facodi_candidates_job_rank ON facodi.classification_candidates(job_id, rank);
CREATE INDEX idx_facodi_candidates_video ON facodi.classification_candidates(video_id);
CREATE UNIQUE INDEX uq_facodi_candidates_course
  ON facodi.classification_candidates(job_id, course_id)
  WHERE candidate_type = 'course';
CREATE UNIQUE INDEX uq_facodi_candidates_unit
  ON facodi.classification_candidates(job_id, curricular_unit_id)
  WHERE candidate_type = 'curricular_unit';
CREATE INDEX idx_facodi_classifications_video ON facodi.video_classifications(video_id);
CREATE INDEX idx_facodi_model_runs_job ON facodi.model_runs(job_id);

CREATE OR REPLACE FUNCTION facodi.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 20,
  course_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  course_id UUID,
  curricular_unit_id UUID,
  content_text TEXT,
  similarity DOUBLE PRECISION,
  metadata JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.id AS chunk_id,
    kc.course_id,
    kc.curricular_unit_id,
    kc.content_text,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata
  FROM facodi.knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND (course_filter IS NULL OR kc.course_id = course_filter)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 100);
$$;

INSERT INTO facodi.taxonomies (code, name, description) VALUES
  ('course_type', 'Tipo de curso', 'Tipos acadêmicos e formativos do catálogo FACODI'),
  ('knowledge_area', 'Área de conhecimento', 'Áreas científicas e disciplinares'),
  ('topic', 'Tópico', 'Tópicos pedagógicos extraídos ou editoriais'),
  ('learning_outcome', 'Resultado de aprendizagem', 'Competências e resultados de aprendizagem'),
  ('skill', 'Competência', 'Competências práticas, cognitivas ou técnicas'),
  ('tool', 'Ferramenta', 'Ferramentas, tecnologias e métodos aplicados'),
  ('methodology', 'Metodologia', 'Abordagens pedagógicas ou científicas'),
  ('language', 'Idioma', 'Idioma principal do conteúdo'),
  ('difficulty', 'Dificuldade', 'Nível pedagógico estimado'),
  ('pedagogical_intent', 'Intenção pedagógica', 'Objetivo de uso do conteúdo no percurso formativo')
ON CONFLICT (code) DO NOTHING;

WITH course_type AS (
  SELECT id FROM facodi.taxonomies WHERE code = 'course_type'
), language_taxonomy AS (
  SELECT id FROM facodi.taxonomies WHERE code = 'language'
), difficulty_taxonomy AS (
  SELECT id FROM facodi.taxonomies WHERE code = 'difficulty'
), intent_taxonomy AS (
  SELECT id FROM facodi.taxonomies WHERE code = 'pedagogical_intent'
)
INSERT INTO facodi.terms (taxonomy_id, name, normalized_name, language)
SELECT course_type.id, value, lower(value), 'pt'
FROM course_type, unnest(ARRAY[
  'Licenciatura',
  'Mestrado',
  'Doutoramento',
  'Curso Técnico Superior Profissional',
  'Pós-Graduação',
  'Formação Livre'
]) AS value
UNION ALL
SELECT language_taxonomy.id, value, lower(value), 'pt'
FROM language_taxonomy, unnest(ARRAY['Português', 'Inglês', 'Espanhol']) AS value
UNION ALL
SELECT difficulty_taxonomy.id, value, lower(value), 'pt'
FROM difficulty_taxonomy, unnest(ARRAY['Introdutório', 'Intermédio', 'Avançado']) AS value
UNION ALL
SELECT intent_taxonomy.id, value, lower(value), 'pt'
FROM intent_taxonomy, unnest(ARRAY['Introdução', 'Aprofundamento', 'Exercício', 'Revisão', 'Aplicação prática']) AS value
ON CONFLICT (taxonomy_id, normalized_name, language) DO NOTHING;

ALTER TABLE facodi.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.curricular_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.course_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.curricular_unit_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.video_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.classification_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.video_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.model_runs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA facodi TO anon, authenticated, service_role;
GRANT SELECT ON
  facodi.courses,
  facodi.curricular_units,
  facodi.taxonomies,
  facodi.terms,
  facodi.course_terms,
  facodi.curricular_unit_terms
TO anon, authenticated;
GRANT SELECT ON
  facodi.knowledge_sources,
  facodi.knowledge_chunks,
  facodi.youtube_videos,
  facodi.video_artifacts,
  facodi.analysis_jobs,
  facodi.classification_candidates,
  facodi.video_classifications,
  facodi.model_runs
TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA facodi TO service_role;
GRANT EXECUTE ON FUNCTION facodi.match_knowledge_chunks(vector, integer, uuid) TO service_role;

CREATE POLICY public_read_published_courses ON facodi.courses
  FOR SELECT TO anon, authenticated
  USING (published IS TRUE AND status = 'active');

CREATE POLICY public_read_units_for_published_courses ON facodi.curricular_units
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM facodi.courses c
      WHERE c.id = course_id
        AND c.published IS TRUE
        AND c.status = 'active'
    )
  );

CREATE POLICY public_read_taxonomies ON facodi.taxonomies
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

CREATE POLICY public_read_terms ON facodi.terms
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

CREATE POLICY public_read_course_terms ON facodi.course_terms
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facodi.courses c
      WHERE c.id = course_id
        AND c.published IS TRUE
        AND c.status = 'active'
    )
  );

CREATE POLICY public_read_unit_terms ON facodi.curricular_unit_terms
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM facodi.curricular_units cu
      JOIN facodi.courses c ON c.id = cu.course_id
      WHERE cu.id = curricular_unit_id
        AND cu.status = 'active'
        AND c.published IS TRUE
        AND c.status = 'active'
    )
  );

CREATE POLICY editor_manage_courses ON facodi.courses
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_manage_units ON facodi.curricular_units
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_manage_taxonomies ON facodi.taxonomies
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_manage_terms ON facodi.terms
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_manage_course_terms ON facodi.course_terms
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_manage_unit_terms ON facodi.curricular_unit_terms
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_knowledge_sources ON facodi.knowledge_sources
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_knowledge_chunks ON facodi.knowledge_chunks
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_videos ON facodi.youtube_videos
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_video_artifacts ON facodi.video_artifacts
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_analysis_jobs ON facodi.analysis_jobs
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_candidates ON facodi.classification_candidates
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_classifications ON facodi.video_classifications
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));

CREATE POLICY editor_read_model_runs ON facodi.model_runs
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('editor', 'admin'));
