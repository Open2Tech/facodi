export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  facodi: {
    Tables: {
      analysis_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          current_step: string
          error_code: string | null
          error_message: string | null
          id: string
          input_payload: Json
          input_url: string | null
          job_type: string
          request_source: string
          requested_by: string | null
          result_payload: Json
          started_at: string | null
          status: string
          updated_at: string
          video_id: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          current_step?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          input_url?: string | null
          job_type?: string
          request_source?: string
          requested_by?: string | null
          result_payload?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          video_id?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          current_step?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          input_url?: string | null
          job_type?: string
          request_source?: string
          requested_by?: string | null
          result_payload?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          video_id?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_jobs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_public_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_jobs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_candidates: {
        Row: {
          candidate_type: string
          combined_score: number | null
          confidence: number | null
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          evidence: Json
          id: string
          job_id: string | null
          justification: string | null
          keyword_score: number | null
          llm_score: number | null
          metadata: Json
          rank: number
          vector_score: number | null
          video_id: string
        }
        Insert: {
          candidate_type: string
          combined_score?: number | null
          confidence?: number | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
          job_id?: string | null
          justification?: string | null
          keyword_score?: number | null
          llm_score?: number | null
          metadata?: Json
          rank: number
          vector_score?: number | null
          video_id: string
        }
        Update: {
          candidate_type?: string
          combined_score?: number | null
          confidence?: number | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
          job_id?: string | null
          justification?: string | null
          keyword_score?: number | null
          llm_score?: number | null
          metadata?: Json
          rank?: number
          vector_score?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classification_candidates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "classification_candidates_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_public_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_candidates_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_terms: {
        Row: {
          confidence: number | null
          course_id: string
          created_at: string
          source: string
          term_id: string
          weight: number
        }
        Insert: {
          confidence?: number | null
          course_id: string
          created_at?: string
          source?: string
          term_id: string
          weight?: number
        }
        Update: {
          confidence?: number | null
          course_id?: string
          created_at?: string
          source?: string
          term_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_terms_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_terms_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          degree_type: string | null
          description_html: string | null
          external_id: string
          external_source: string
          id: string
          language: string | null
          metadata: Json
          normalized_title: string
          odoo_channel_id: number | null
          plan_url: string | null
          published: boolean
          school: string | null
          slug: string
          source_url: string | null
          status: string
          summary: string | null
          synced_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree_type?: string | null
          description_html?: string | null
          external_id: string
          external_source?: string
          id?: string
          language?: string | null
          metadata?: Json
          normalized_title: string
          odoo_channel_id?: number | null
          plan_url?: string | null
          published?: boolean
          school?: string | null
          slug: string
          source_url?: string | null
          status?: string
          summary?: string | null
          synced_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree_type?: string | null
          description_html?: string | null
          external_id?: string
          external_source?: string
          id?: string
          language?: string | null
          metadata?: Json
          normalized_title?: string
          odoo_channel_id?: number | null
          plan_url?: string | null
          published?: boolean
          school?: string | null
          slug?: string
          source_url?: string | null
          status?: string
          summary?: string | null
          synced_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      curricular_unit_terms: {
        Row: {
          confidence: number | null
          created_at: string
          curricular_unit_id: string
          source: string
          term_id: string
          weight: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          curricular_unit_id: string
          source?: string
          term_id: string
          weight?: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          curricular_unit_id?: string
          source?: string
          term_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "curricular_unit_terms_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricular_unit_terms_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "curricular_unit_terms_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricular_unit_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      curricular_units: {
        Row: {
          code: string | null
          course_id: string
          created_at: string
          curricular_year: number | null
          description_html: string | null
          ects: number | null
          external_id: string
          external_source: string
          id: string
          language: string | null
          metadata: Json
          normalized_title: string
          odoo_slide_id: number | null
          official_pdf_url: string | null
          semester: number | null
          slug: string
          status: string
          summary: string | null
          synced_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          course_id: string
          created_at?: string
          curricular_year?: number | null
          description_html?: string | null
          ects?: number | null
          external_id: string
          external_source?: string
          id?: string
          language?: string | null
          metadata?: Json
          normalized_title: string
          odoo_slide_id?: number | null
          official_pdf_url?: string | null
          semester?: number | null
          slug: string
          status?: string
          summary?: string | null
          synced_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          course_id?: string
          created_at?: string
          curricular_year?: number | null
          description_html?: string | null
          ects?: number | null
          external_id?: string
          external_source?: string
          id?: string
          language?: string | null
          metadata?: Json
          normalized_title?: string
          odoo_slide_id?: number | null
          official_pdf_url?: string | null
          semester?: number | null
          slug?: string
          status?: string
          summary?: string | null
          synced_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          chunk_type: string
          content_text: string
          content_tokens: number | null
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          embedding: string | null
          entity_type: string
          id: string
          metadata: Json
          source_id: string
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          chunk_type?: string
          content_text: string
          content_tokens?: number | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          embedding?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          source_id: string
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          chunk_type?: string
          content_text?: string
          content_tokens?: number | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          embedding?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          source_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "knowledge_chunks_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          content_hash: string | null
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          entity_type: string
          id: string
          metadata: Json
          source_type: string
          source_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          source_type: string
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          source_type?: string
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_sources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_sources_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_sources_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "knowledge_sources_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
        ]
      }
      model_runs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_hash: string | null
          input_summary: string | null
          job_id: string | null
          latency_ms: number | null
          model: string
          output_json: Json
          prompt_version: string | null
          provider: string
          purpose: string
          status: string
          usage_json: Json
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_hash?: string | null
          input_summary?: string | null
          job_id?: string | null
          latency_ms?: number | null
          model: string
          output_json?: Json
          prompt_version?: string | null
          provider: string
          purpose: string
          status?: string
          usage_json?: Json
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_hash?: string | null
          input_summary?: string | null
          job_id?: string | null
          latency_ms?: number | null
          model?: string
          output_json?: Json
          prompt_version?: string | null
          provider?: string
          purpose?: string
          status?: string
          usage_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "model_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomies: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          aliases: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string
          metadata: Json
          name: string
          normalized_name: string
          parent_id: string | null
          taxonomy_id: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          name: string
          normalized_name: string
          parent_id?: string | null
          taxonomy_id: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          name?: string
          normalized_name?: string
          parent_id?: string | null
          taxonomy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      video_artifacts: {
        Row: {
          artifact_type: string
          content_hash: string | null
          content_json: Json
          content_text: string | null
          created_at: string
          embedding: string | null
          id: string
          language: string | null
          metadata: Json
          source: string
          updated_at: string
          video_id: string
        }
        Insert: {
          artifact_type: string
          content_hash?: string | null
          content_json?: Json
          content_text?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source?: string
          updated_at?: string
          video_id: string
        }
        Update: {
          artifact_type?: string
          content_hash?: string | null
          content_json?: Json
          content_text?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_artifacts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_artifacts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_public_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_artifacts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_classifications: {
        Row: {
          confidence: number
          confidence_level: string
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          evidence: Json
          id: string
          job_id: string | null
          justification: string | null
          metadata: Json
          model_run_id: string | null
          needs_review: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          video_id: string
        }
        Insert: {
          confidence: number
          confidence_level?: string
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
          job_id?: string | null
          justification?: string | null
          metadata?: Json
          model_run_id?: string | null
          needs_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          video_id: string
        }
        Update: {
          confidence?: number
          confidence_level?: string
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
          job_id?: string | null
          justification?: string | null
          metadata?: Json
          model_run_id?: string | null
          needs_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_model_run_id_fkey"
            columns: ["model_run_id"]
            isOneToOne: false
            referencedRelation: "model_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_public_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_videos: {
        Row: {
          canonical_url: string
          channel_id: string | null
          channel_title: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          language: string | null
          metadata: Json
          published_at: string | null
          status: string
          tags: string[]
          thumbnails: Json
          title: string | null
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          canonical_url: string
          channel_id?: string | null
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          metadata?: Json
          published_at?: string | null
          status?: string
          tags?: string[]
          thumbnails?: Json
          title?: string | null
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          canonical_url?: string
          channel_id?: string | null
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          metadata?: Json
          published_at?: string | null
          status?: string
          tags?: string[]
          thumbnails?: Json
          title?: string | null
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_admin_video_classifications: {
        Row: {
          channel_title: string | null
          confidence: number | null
          confidence_level: string | null
          course_id: string | null
          course_title: string | null
          created_at: string | null
          curricular_unit_id: string | null
          evidence: Json | null
          id: string | null
          justification: string | null
          metadata: Json | null
          needs_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          thumbnail_url: string | null
          unit_code: string | null
          unit_title: string | null
          updated_at: string | null
          video_id: string | null
          video_title: string | null
          youtube_video_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_public_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_catalog_courses: {
        Row: {
          code: string | null
          content_license: string | null
          curriculum_version: string | null
          degree_type: string | null
          description: string | null
          ects: number | null
          id: string | null
          institution: string | null
          language: string | null
          long_description: string | null
          metadata: Json | null
          published: boolean | null
          school: string | null
          semesters: number | null
          slug: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          code?: never
          content_license?: never
          curriculum_version?: never
          degree_type?: string | null
          description?: never
          ects?: never
          id?: string | null
          institution?: never
          language?: string | null
          long_description?: never
          metadata?: Json | null
          published?: boolean | null
          school?: string | null
          semesters?: never
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          code?: never
          content_license?: never
          curriculum_version?: never
          degree_type?: string | null
          description?: never
          ects?: never
          id?: string | null
          institution?: never
          language?: string | null
          long_description?: never
          metadata?: Json | null
          published?: boolean | null
          school?: string | null
          semesters?: never
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_catalog_playlists: {
        Row: {
          course_code: string | null
          course_id: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          slug: string | null
          title: string | null
          total_duration_seconds: number | null
          unit_code: string | null
          unit_id: string | null
          updated_at: string | null
          video_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_catalog_units: {
        Row: {
          category: string | null
          code: string | null
          content: string | null
          content_url: string | null
          contributor: string | null
          course_code: string | null
          course_id: string | null
          difficulty: string | null
          duration: string | null
          ects: number | null
          id: string | null
          metadata: Json | null
          name: string | null
          position: number | null
          prerequisites: string[] | null
          section_name: string | null
          semester: number | null
          slug: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          syllabus_url: string | null
          tags: string[] | null
          unit_code: string | null
          updated_at: string | null
          video_url: string | null
          website_url: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricular_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_playlist_videos: {
        Row: {
          channel_name: string | null
          classification_id: string | null
          classification_status: string | null
          confidence: number | null
          course_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string | null
          language: string | null
          playlist_id: string | null
          playlist_slug: string | null
          playlist_title: string | null
          position: number | null
          thumbnail_url: string | null
          title: string | null
          unit_id: string | null
          updated_at: string | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_videos: {
        Row: {
          channel_name: string | null
          classification_id: string | null
          classification_status: string | null
          confidence: number | null
          course_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string | null
          language: string | null
          thumbnail_url: string | null
          title: string | null
          unit_id: string | null
          updated_at: string | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_playlists"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_catalog_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      match_knowledge_chunks: {
        Args: {
          course_filter?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content_text: string
          course_id: string
          curricular_unit_id: string
          metadata: Json
          similarity: number
        }[]
      }
      slugify_text: {
        Args: { fallback?: string; value: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_enrichments: {
        Row: {
          created_at: string | null
          cultural_relevance: string | null
          id: string
          language: string | null
          optimized_title: string | null
          reprocessed_at: string | null
          semantic_tags: string[] | null
          short_summary: string | null
          suggested_category_id: string | null
          summary_description: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          cultural_relevance?: string | null
          id?: string
          language?: string | null
          optimized_title?: string | null
          reprocessed_at?: string | null
          semantic_tags?: string[] | null
          short_summary?: string | null
          suggested_category_id?: string | null
          summary_description?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          cultural_relevance?: string | null
          id?: string
          language?: string | null
          optimized_title?: string | null
          reprocessed_at?: string | null
          semantic_tags?: string[] | null
          short_summary?: string | null
          suggested_category_id?: string | null
          summary_description?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_enrichments_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enrichments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "ai_enrichments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enrichments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body_en: string | null
          body_pt: string
          created_at: string | null
          id: string
          metadata: Json | null
          published: boolean
          slug: string
          title_en: string | null
          title_pt: string
          updated_at: string | null
        }
        Insert: {
          body_en?: string | null
          body_pt?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean
          slug: string
          title_en?: string | null
          title_pt: string
          updated_at?: string | null
        }
        Update: {
          body_en?: string | null
          body_pt?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean
          slug?: string
          title_en?: string | null
          title_pt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_progress: {
        Row: {
          completed_at: string | null
          content_id: string | null
          content_type: string
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          duration_seconds: number | null
          first_accessed_at: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number
          status: string
          updated_at: string
          user_id: string
          watch_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          content_id?: string | null
          content_type: string
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          duration_seconds?: number | null
          first_accessed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          status?: string
          updated_at?: string
          user_id: string
          watch_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string | null
          content_type?: string
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          duration_seconds?: number | null
          first_accessed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          status?: string
          updated_at?: string
          user_id?: string
          watch_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "content_progress_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "content_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_submissions: {
        Row: {
          additional_notes: string | null
          assigned_to: string | null
          author_email: string | null
          author_id: string | null
          author_name: string | null
          content_type: string
          course_id: string | null
          created_at: string | null
          id: string
          pedagogical_reason: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_title: string
          summary: string | null
          tags: string[] | null
          topic: string | null
          unit_id: string | null
          updated_at: string | null
          url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          assigned_to?: string | null
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content_type: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          pedagogical_reason?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_title: string
          summary?: string | null
          tags?: string[] | null
          topic?: string | null
          unit_id?: string | null
          updated_at?: string | null
          url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          assigned_to?: string | null
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content_type?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          pedagogical_reason?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_title?: string
          summary?: string | null
          tags?: string[] | null
          topic?: string | null
          unit_id?: string | null
          updated_at?: string | null
          url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_submissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_submissions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          content_license: string | null
          created_at: string
          curriculum_version: string | null
          degree_type: string
          description: string | null
          duration_semesters: number
          ects_total: number
          enroll: string | null
          id: string
          institution: string | null
          is_active: boolean
          language_code: string
          long_description: string | null
          members_count: number | null
          metadata: Json
          odoo_id: number | null
          school: string | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          code: string
          content_license?: string | null
          created_at?: string
          curriculum_version?: string | null
          degree_type?: string
          description?: string | null
          duration_semesters?: number
          ects_total?: number
          enroll?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean
          language_code?: string
          long_description?: string | null
          members_count?: number | null
          metadata?: Json
          odoo_id?: number | null
          school?: string | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          code?: string
          content_license?: string | null
          created_at?: string
          curriculum_version?: string | null
          degree_type?: string
          description?: string | null
          duration_semesters?: number
          ects_total?: number
          enroll?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean
          language_code?: string
          long_description?: string | null
          members_count?: number | null
          metadata?: Json
          odoo_id?: number | null
          school?: string | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          conversion_score: number
          created_at: string | null
          description: string
          id: string
          lead_id: string
          processes_score: number
          title: string
          updated_at: string | null
          visibility_score: number
        }
        Insert: {
          conversion_score: number
          created_at?: string | null
          description: string
          id?: string
          lead_id: string
          processes_score: number
          title: string
          updated_at?: string | null
          visibility_score: number
        }
        Update: {
          conversion_score?: number
          created_at?: string | null
          description?: string
          id?: string
          lead_id?: string
          processes_score?: number
          title?: string
          updated_at?: string | null
          visibility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_applications: {
        Row: {
          availability: string | null
          confirmation_error: string | null
          confirmation_provider_id: string | null
          confirmation_sent_at: string | null
          consent_privacy: boolean
          created_at: string
          email: string
          experience_summary: string | null
          full_name: string
          guidelines_accepted: boolean | null
          id: string
          motivation: string | null
          portfolio_url: string | null
          relevant_links: string[] | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_page: string
          specialty_area: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          confirmation_error?: string | null
          confirmation_provider_id?: string | null
          confirmation_sent_at?: string | null
          consent_privacy?: boolean
          created_at?: string
          email: string
          experience_summary?: string | null
          full_name: string
          guidelines_accepted?: boolean | null
          id?: string
          motivation?: string | null
          portfolio_url?: string | null
          relevant_links?: string[] | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_page?: string
          specialty_area?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          confirmation_error?: string | null
          confirmation_provider_id?: string | null
          confirmation_sent_at?: string | null
          consent_privacy?: boolean
          created_at?: string
          email?: string
          experience_summary?: string | null
          full_name?: string
          guidelines_accepted?: boolean | null
          id?: string
          motivation?: string | null
          portfolio_url?: string | null
          relevant_links?: string[] | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_page?: string
          specialty_area?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          brand_name: string | null
          created_at: string | null
          decision_profile: string
          email: string
          id: string
          instagram: string | null
          linkedin: string | null
          no_brand: boolean | null
          other_revenue_model: string | null
          revenue_model: string
          status: string | null
          struggle: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string | null
          decision_profile: string
          email: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          no_brand?: boolean | null
          other_revenue_model?: string | null
          revenue_model: string
          status?: string | null
          struggle: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string | null
          decision_profile?: string
          email?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          no_brand?: boolean | null
          other_revenue_model?: string | null
          revenue_model?: string
          status?: string | null
          struggle?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_collaborators: {
        Row: {
          id: string
          invited_at: string | null
          playlist_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          playlist_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          playlist_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_course_playlist_catalog"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_education_playlist_assignment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_follow_counts"
            referencedColumns: ["playlist_id"]
          },
        ]
      }
      playlist_editor_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          playlist_id: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          playlist_id: string
          requester_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          playlist_id?: string
          requester_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_editor_requests_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_editor_requests_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_course_playlist_catalog"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_editor_requests_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_education_playlist_assignment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_editor_requests_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_editor_requests_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_follow_counts"
            referencedColumns: ["playlist_id"]
          },
        ]
      }
      playlist_follows: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean
          playlist_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          playlist_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          playlist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_follows_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_follows_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_course_playlist_catalog"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_follows_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_education_playlist_assignment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_follows_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_follows_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_follow_counts"
            referencedColumns: ["playlist_id"]
          },
        ]
      }
      playlist_progress: {
        Row: {
          created_at: string | null
          id: string
          last_position_seconds: number | null
          playlist_id: string
          updated_at: string | null
          user_id: string
          video_id: string
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          playlist_id: string
          updated_at?: string | null
          user_id: string
          video_id: string
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          playlist_id?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
          watched?: boolean
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_course_playlist_catalog"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_education_playlist_assignment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_follow_counts"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "playlist_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_videos: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          playlist_id: string
          position: number
          video_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          playlist_id: string
          position?: number
          video_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          playlist_id?: string
          position?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_course_playlist_catalog"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_education_playlist_assignment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_follow_counts"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          author_id: string
          course_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_ordered: boolean
          is_public: boolean
          language: string
          name: string
          slug: string
          thumbnail_url: string | null
          total_duration_seconds: number | null
          unit_code: string | null
          updated_at: string | null
          video_count: number | null
        }
        Insert: {
          author_id: string
          course_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ordered?: boolean
          is_public?: boolean
          language?: string
          name: string
          slug: string
          thumbnail_url?: string | null
          total_duration_seconds?: number | null
          unit_code?: string | null
          updated_at?: string | null
          video_count?: number | null
        }
        Update: {
          author_id?: string
          course_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ordered?: boolean
          is_public?: boolean
          language?: string
          name?: string
          slug?: string
          thumbnail_url?: string | null
          total_duration_seconds?: number | null
          unit_code?: string | null
          updated_at?: string | null
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          submissions_count: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          submissions_count?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          submissions_count?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string | null
          diagnosis_id: string
          id: string
          priority: number | null
          recommendation: string
        }
        Insert: {
          created_at?: string | null
          diagnosis_id: string
          id?: string
          priority?: number | null
          recommendation: string
        }
        Update: {
          created_at?: string | null
          diagnosis_id?: string
          id?: string
          priority?: number | null
          recommendation?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_favorites: {
        Row: {
          created_at: string
          id: string
          unit_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          unit_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          unit_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_favorites_unit_code_fkey"
            columns: ["unit_code"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["code"]
          },
        ]
      }
      units: {
        Row: {
          category: string | null
          code: string
          content: string | null
          content_url: string | null
          contributor: string | null
          course_id: string
          created_at: string
          difficulty: string | null
          duration: string | null
          ects: number
          editorial_state: string | null
          id: string
          metadata: Json
          name: string
          odoo_id: number | null
          position: number
          prerequisites: string[]
          section_name: string | null
          semester: number
          slide_category: string | null
          source_url: string | null
          summary: string | null
          syllabus_url: string | null
          tags: string[]
          unit_code: string | null
          updated_at: string
          video_url: string | null
          website_url: string | null
          year: number
        }
        Insert: {
          category?: string | null
          code: string
          content?: string | null
          content_url?: string | null
          contributor?: string | null
          course_id: string
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          ects?: number
          editorial_state?: string | null
          id?: string
          metadata?: Json
          name: string
          odoo_id?: number | null
          position?: number
          prerequisites?: string[]
          section_name?: string | null
          semester?: number
          slide_category?: string | null
          source_url?: string | null
          summary?: string | null
          syllabus_url?: string | null
          tags?: string[]
          unit_code?: string | null
          updated_at?: string
          video_url?: string | null
          website_url?: string | null
          year?: number
        }
        Update: {
          category?: string | null
          code?: string
          content?: string | null
          content_url?: string | null
          contributor?: string | null
          course_id?: string
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          ects?: number
          editorial_state?: string | null
          id?: string
          metadata?: Json
          name?: string
          odoo_id?: number | null
          position?: number
          prerequisites?: string[]
          section_name?: string | null
          semester?: number
          slide_category?: string | null
          source_url?: string | null
          summary?: string | null
          syllabus_url?: string | null
          tags?: string[]
          unit_code?: string | null
          updated_at?: string
          video_url?: string | null
          website_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_accounts: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      video_submissions: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicate_video_id: string | null
          error_message: string | null
          id: string
          metadata: Json
          processing_started_at: string | null
          recoverable: boolean
          status: string
          updated_at: string
          user_id: string
          video_id: string | null
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicate_video_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          processing_started_at?: string | null
          recoverable?: boolean
          status?: string
          updated_at?: string
          user_id: string
          video_id?: string | null
          youtube_id: string
          youtube_url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicate_video_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          processing_started_at?: string | null
          recoverable?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_duplicate_video_id_fkey"
            columns: ["duplicate_video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "video_submissions_duplicate_video_id_fkey"
            columns: ["duplicate_video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_duplicate_video_id_fkey"
            columns: ["duplicate_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "video_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_transcripts: {
        Row: {
          confidence: number
          created_at: string
          error_message: string | null
          id: string
          language: string | null
          metadata: Json
          provider: string
          provider_model: string
          status: string
          summary: string | null
          transcript_text: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          provider?: string
          provider_model: string
          status?: string
          summary?: string | null
          transcript_text?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          provider?: string
          provider_model?: string
          status?: string
          summary?: string | null
          transcript_text?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "video_transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_view_events: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
          video_id: string
          viewed_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id: string
          viewed_on?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id?: string
          viewed_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_view_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_playlist_exhibition"
            referencedColumns: ["preview_video_id"]
          },
          {
            foreignKeyName: "video_view_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "v_video_exhibition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_view_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          channel_name: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          favorites_count: number
          id: string
          is_featured: boolean
          language: string
          playlist_add_count: number
          submitted_by: string | null
          thumbnail_url: string
          title: string
          updated_at: string
          view_count: number
          youtube_id: string
        }
        Insert: {
          category_id?: string | null
          channel_name: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          favorites_count?: number
          id?: string
          is_featured?: boolean
          language?: string
          playlist_add_count?: number
          submitted_by?: string | null
          thumbnail_url: string
          title: string
          updated_at?: string
          view_count?: number
          youtube_id: string
        }
        Update: {
          category_id?: string | null
          channel_name?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          favorites_count?: number
          id?: string
          is_featured?: boolean
          language?: string
          playlist_add_count?: number
          submitted_by?: string | null
          thumbnail_url?: string
          title?: string
          updated_at?: string
          view_count?: number
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_course_playlist_catalog: {
        Row: {
          author_id: string | null
          collaborators_count: number | null
          course_code: string | null
          course_name: string | null
          created_at: string | null
          is_ordered: boolean | null
          is_public: boolean | null
          language: string | null
          playlist_description: string | null
          playlist_id: string | null
          playlist_name: string | null
          playlist_slug: string | null
          playlist_videos_rows: number | null
          semester_label: string | null
          thumbnail_url: string | null
          total_duration_seconds: number | null
          unit_code: string | null
          updated_at: string | null
          video_count: number | null
          video_range: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_course_playlist_summary: {
        Row: {
          collections_total: number | null
          course_code: string | null
          course_name: string | null
          empty_playlists_total: number | null
          first_playlist_created_at: string | null
          languages: string[] | null
          last_playlist_updated_at: string | null
          learning_paths_total: number | null
          playlists: Json | null
          playlists_total: number | null
          public_playlists_total: number | null
          semesters: string[] | null
          total_duration_seconds: number | null
          units_total: number | null
          videos_total: number | null
        }
        Relationships: []
      }
      v_education_playlist_assignment_candidates: {
        Row: {
          assignment_kind: string | null
          course_code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_assignment_candidate: boolean | null
          is_ordered: boolean | null
          is_public: boolean | null
          language: string | null
          name: string | null
          slug: string | null
          total_duration_seconds: number | null
          unit_code: string | null
          updated_at: string | null
          video_count: number | null
        }
        Insert: {
          assignment_kind?: never
          course_code?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_assignment_candidate?: never
          is_ordered?: boolean | null
          is_public?: boolean | null
          language?: string | null
          name?: string | null
          slug?: string | null
          total_duration_seconds?: number | null
          unit_code?: never
          updated_at?: string | null
          video_count?: number | null
        }
        Update: {
          assignment_kind?: never
          course_code?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_assignment_candidate?: never
          is_ordered?: boolean | null
          is_public?: boolean | null
          language?: string | null
          name?: string | null
          slug?: string | null
          total_duration_seconds?: number | null
          unit_code?: never
          updated_at?: string | null
          video_count?: number | null
        }
        Relationships: []
      }
      v_home_exhibition: {
        Row: {
          categories: Json | null
          curation_signals: Json | null
          facodi_highlights: Json | null
          featured_playlists: Json | null
          generated_at: string | null
          hero_videos: Json | null
          metrics: Json | null
        }
        Relationships: []
      }
      v_playlist_exhibition: {
        Row: {
          activity_at: string | null
          author_avatar_url: string | null
          author_display_name: string | null
          author_id: string | null
          author_username: string | null
          collaborator_count: number | null
          course_code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_ordered: boolean | null
          is_public: boolean | null
          language: string | null
          name: string | null
          preview_video_channel_name: string | null
          preview_video_id: string | null
          preview_video_thumbnail_url: string | null
          preview_video_title: string | null
          slug: string | null
          thumbnail_url: string | null
          total_duration_seconds: number | null
          unit_code: string | null
          updated_at: string | null
          video_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_playlist_follow_counts: {
        Row: {
          followers_count: number | null
          notifying_followers_count: number | null
          playlist_id: string | null
        }
        Relationships: []
      }
      v_video_exhibition: {
        Row: {
          category_color: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          channel_name: string | null
          comment_count: number | null
          created_at: string | null
          description: string | null
          detected_language: string | null
          duration_seconds: number | null
          effective_language: string | null
          enrichment_cultural_relevance: string | null
          enrichment_language: string | null
          enrichment_optimized_title: string | null
          enrichment_semantic_tags: string[] | null
          enrichment_short_summary: string | null
          enrichment_summary_description: string | null
          favorites_count: number | null
          id: string | null
          is_featured: boolean | null
          language: string | null
          playlist_add_count: number | null
          playlist_count: number | null
          submitted_by: string | null
          submitted_by_avatar_url: string | null
          submitted_by_display_name: string | null
          submitted_by_username: string | null
          thumbnail_url: string | null
          title: string | null
          transcript_language: string | null
          transcript_status: string | null
          transcript_summary: string | null
          updated_at: string | null
          view_count: number | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_video_to_default_education_playlist: {
        Args: { p_video_id: string }
        Returns: string
      }
      current_profile_can_manage_facodi_playlist: {
        Args: never
        Returns: boolean
      }
      delete_user_account: { Args: never; Returns: undefined }
      follow_by_username_secure: {
        Args: { p_target_username: string }
        Returns: string
      }
      get_conversation_by_username_secure: {
        Args: { p_other_username: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_mine: boolean
          is_read: boolean
          receiver_avatar_url: string
          receiver_display_name: string
          receiver_username: string
          sender_avatar_url: string
          sender_display_name: string
          sender_username: string
        }[]
      }
      get_default_education_playlist_id: { Args: never; Returns: string }
      get_follow_stats_by_username_secure: {
        Args: { p_target_username: string }
        Returns: {
          followers_count: number
          following_count: number
        }[]
      }
      get_unread_messages_count_secure: { Args: never; Returns: number }
      get_unread_notifications_count_secure: { Args: never; Returns: number }
      increment_video_view_count:
        | { Args: { p_video_id: string }; Returns: number }
        | {
            Args: { p_session_id?: string; p_video_id: string }
            Returns: number
          }
      is_education_assignment_playlist: {
        Args: {
          p_course_code: string
          p_is_ordered: boolean
          p_slug: string
          p_unit_code: string
        }
        Returns: boolean
      }
      is_facodi_playlist: {
        Args: {
          p_course_code: string
          p_is_ordered: boolean
          p_unit_code: string
        }
        Returns: boolean
      }
      is_following_by_username_secure: {
        Args: { p_target_username: string }
        Returns: boolean
      }
      is_playlist_owner_or_collaborator: {
        Args: { p_playlist_id: string; p_user_id: string }
        Returns: boolean
      }
      list_education_playlists_for_assignment: {
        Args: { p_language?: string; p_limit?: number }
        Returns: {
          course_code: string
          description: string
          id: string
          is_ordered: boolean
          is_public: boolean
          language: string
          name: string
          unit_code: string
        }[]
      }
      list_featured_videos: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          category: Json
          category_id: string
          channel_name: string
          created_at: string
          description: string
          duration_seconds: number
          favorites_count: number
          featured_score: number
          id: string
          is_featured: boolean
          language: string
          playlist_add_count: number
          submitted_by: string
          thumbnail_url: string
          title: string
          updated_at: string
          view_count: number
          youtube_id: string
        }[]
      }
      list_followers_by_username_secure: {
        Args: { p_target_username: string }
        Returns: {
          followed_at: string
          follower_avatar_url: string
          follower_display_name: string
          follower_username: string
        }[]
      }
      list_following_by_username_secure: {
        Args: { p_target_username: string }
        Returns: {
          followed_at: string
          following_avatar_url: string
          following_display_name: string
          following_username: string
        }[]
      }
      list_inbox_conversations_secure: {
        Args: never
        Returns: {
          last_message_content: string
          last_message_created_at: string
          last_message_id: string
          last_message_is_read: boolean
          last_message_sender_username: string
          partner_avatar_url: string
          partner_display_name: string
          partner_username: string
          unread_count: number
        }[]
      }
      list_notifications_secure: {
        Args: { p_limit?: number }
        Returns: {
          actor_avatar_url: string
          actor_display_name: string
          actor_username: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_read: boolean
          message: string
          read_at: string
          title: string
          type: string
        }[]
      }
      log_edge_function_call: {
        Args: {
          p_error_message?: string
          p_function_name: string
          p_lead_email?: string
          p_metadata?: Json
          p_status?: string
        }
        Returns: undefined
      }
      mark_all_notifications_as_read_secure: { Args: never; Returns: number }
      mark_conversation_as_read_by_username_secure: {
        Args: { p_other_username: string }
        Returns: number
      }
      mark_notification_as_read_secure: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_top_videos_as_featured: {
        Args: { p_limit?: number }
        Returns: number
      }
      mark_video_submission_client_error: {
        Args: {
          p_error_code?: string
          p_error_message: string
          p_stage?: string
          p_submission_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          duplicate_video_id: string | null
          error_message: string | null
          id: string
          metadata: Json
          processing_started_at: string | null
          recoverable: boolean
          status: string
          updated_at: string
          user_id: string
          video_id: string | null
          youtube_id: string
          youtube_url: string
        }
        SetofOptions: {
          from: "*"
          to: "video_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      normalize_slug_for_education_assignment: {
        Args: { p_value: string }
        Returns: string
      }
      playlist_accessible_to_user:
        | { Args: { p_playlist_id: string }; Returns: boolean }
        | {
            Args: { p_playlist_id: string; p_user_id: string }
            Returns: boolean
          }
      save_lead_with_diagnosis: {
        Args: {
          p_brand_name: string
          p_conversion_score: number
          p_decision_profile: string
          p_diagnosis_description: string
          p_diagnosis_title: string
          p_email: string
          p_instagram: string
          p_linkedin: string
          p_no_brand: boolean
          p_other_revenue_model: string
          p_processes_score: number
          p_recommendations?: string[]
          p_revenue_model: string
          p_sources?: Json
          p_struggle: string
          p_visibility_score: number
          p_website: string
        }
        Returns: {
          diagnosis_id: string
          lead_id: string
        }[]
      }
      send_direct_message_by_username_secure: {
        Args: { p_content: string; p_receiver_username: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_mine: boolean
          is_read: boolean
          receiver_username: string
          sender_username: string
        }[]
      }
      unfollow_by_username_secure: {
        Args: { p_target_username: string }
        Returns: number
      }
      update_playlist_derived_fields: {
        Args: { p_playlist_id: string }
        Returns: undefined
      }
      update_playlist_thumbnail_from_first_video: {
        Args: { p_playlist_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  facodi: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
