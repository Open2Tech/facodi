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
    PostgrestVersion: "14.18"
  }
  facodi: {
    Tables: {
      analysis_job_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          job_id: string
          message: string | null
          metadata: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          job_id: string
          message?: string | null
          metadata?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analysis_job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
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
          learning_object_id: string | null
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
          learning_object_id?: string | null
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
          learning_object_id?: string | null
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
            foreignKeyName: "analysis_jobs_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
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
      analysis_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          job_id: string | null
          learning_object_id: string
          payload: Json
          provider: string | null
          provider_model: string | null
          result_type: string
          summary: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          learning_object_id: string
          payload?: Json
          provider?: string | null
          provider_model?: string | null
          result_type: string
          summary?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          learning_object_id?: string
          payload?: Json
          provider?: string | null
          provider_model?: string | null
          result_type?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_results_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          learning_object_id: string | null
          level: string | null
          metadata: Json
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_object_id?: string | null
          level?: string | null
          metadata?: Json
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          learning_object_id?: string | null
          level?: string | null
          metadata?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          created_at: string
          degree_type: string | null
          description_html: string | null
          duration_semesters: number | null
          ects_total: number | null
          external_id: string | null
          external_source: string
          id: string
          institution: string | null
          language: string | null
          learning_object_id: string | null
          metadata: Json
          normalized_title: string | null
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
          code?: string | null
          created_at?: string
          degree_type?: string | null
          description_html?: string | null
          duration_semesters?: number | null
          ects_total?: number | null
          external_id?: string | null
          external_source?: string
          id?: string
          institution?: string | null
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          normalized_title?: string | null
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
          code?: string | null
          created_at?: string
          degree_type?: string | null
          description_html?: string | null
          duration_semesters?: number | null
          ects_total?: number | null
          external_id?: string | null
          external_source?: string
          id?: string
          institution?: string | null
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          normalized_title?: string | null
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
        Relationships: [
          {
            foreignKeyName: "courses_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: true
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      curricular_units: {
        Row: {
          code: string | null
          course_id: string
          created_at: string
          description_html: string | null
          ects: number | null
          external_id: string | null
          external_source: string
          id: string
          language: string | null
          learning_object_id: string | null
          metadata: Json
          normalized_title: string | null
          plan_url: string | null
          position: number | null
          published: boolean
          semester: number | null
          slug: string | null
          source_url: string | null
          status: string
          summary: string | null
          synced_at: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          code?: string | null
          course_id: string
          created_at?: string
          description_html?: string | null
          ects?: number | null
          external_id?: string | null
          external_source?: string
          id?: string
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          normalized_title?: string | null
          plan_url?: string | null
          position?: number | null
          published?: boolean
          semester?: number | null
          slug?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          synced_at?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          code?: string | null
          course_id?: string
          created_at?: string
          description_html?: string | null
          ects?: number | null
          external_id?: string | null
          external_source?: string
          id?: string
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          normalized_title?: string | null
          plan_url?: string | null
          position?: number | null
          published?: boolean
          semester?: number | null
          slug?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          synced_at?: string | null
          title?: string
          updated_at?: string
          year?: number | null
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
            foreignKeyName: "curricular_units_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: true
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checksum: string | null
          created_at: string
          id: string
          language: string
          learning_object_id: string | null
          metadata: Json
          mime_type: string | null
          source_url: string | null
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          id?: string
          language?: string
          learning_object_id?: string | null
          metadata?: Json
          mime_type?: string | null
          source_url?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          id?: string
          language?: string
          learning_object_id?: string | null
          metadata?: Json
          mime_type?: string | null
          source_url?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_playlist_progress: {
        Row: {
          completed_at: string | null
          completion_source: string
          created_at: string
          last_position_seconds: number
          playlist_id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_source?: string
          created_at?: string
          last_position_seconds?: number
          playlist_id: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed_at?: string | null
          completion_source?: string
          created_at?: string
          last_position_seconds?: number
          playlist_id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_playlist_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_playlist_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          event_key: string
          event_payload: Json
          failure_code: string | null
          id: string
          locked_at: string | null
          next_attempt_at: string
          playlist_id: string
          provider_message_id: string | null
          recipient_user_id: string
          sent_at: string | null
          state: string
          template_name: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_key: string
          event_payload?: Json
          failure_code?: string | null
          id?: string
          locked_at?: string | null
          next_attempt_at?: string
          playlist_id: string
          provider_message_id?: string | null
          recipient_user_id: string
          sent_at?: string | null
          state?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_key?: string
          event_payload?: Json
          failure_code?: string | null
          id?: string
          locked_at?: string | null
          next_attempt_at?: string
          playlist_id?: string
          provider_message_id?: string | null
          recipient_user_id?: string
          sent_at?: string | null
          state?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content_hash: string | null
          created_at: string
          dimensions: number | null
          embedding: Json
          id: string
          learning_object_id: string
          metadata: Json
          model: string
          provider: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          dimensions?: number | null
          embedding: Json
          id?: string
          learning_object_id: string
          metadata?: Json
          model: string
          provider: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          dimensions?: number | null
          embedding?: Json
          id?: string
          learning_object_id?: string
          metadata?: Json
          model?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      external_sources: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          imported_at: string | null
          learning_object_id: string | null
          metadata: Json
          source_type: string
          source_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          imported_at?: string | null
          learning_object_id?: string | null
          metadata?: Json
          source_type: string
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          imported_at?: string | null
          learning_object_id?: string | null
          metadata?: Json
          source_type?: string
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_sources_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_structures: {
        Row: {
          created_at: string
          created_by: string | null
          generated_by: string | null
          id: string
          prompt: Json
          result: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_object_id: string | null
          status: string
          structure_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          generated_by?: string | null
          id?: string
          prompt?: Json
          result?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_object_id?: string | null
          status?: string
          structure_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          generated_by?: string | null
          id?: string
          prompt?: Json
          result?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_object_id?: string | null
          status?: string
          structure_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_structures_root_object_id_fkey"
            columns: ["root_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
          language: string
          learning_object_id: string
          metadata: Json
          normalized_keyword: string
          source: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          language?: string
          learning_object_id: string
          metadata?: Json
          normalized_keyword: string
          source?: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          language?: string
          learning_object_id?: string
          metadata?: Json
          normalized_keyword?: string
          source?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "keywords_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_object_relations: {
        Row: {
          child_object_id: string
          confidence_score: number | null
          created_at: string
          created_by: string | null
          created_by_mechanism: string | null
          id: string
          metadata: Json
          parent_object_id: string
          position: number | null
          relation_type: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          child_object_id: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          created_by_mechanism?: string | null
          id?: string
          metadata?: Json
          parent_object_id: string
          position?: number | null
          relation_type: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          child_object_id?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          created_by_mechanism?: string | null
          id?: string
          metadata?: Json
          parent_object_id?: string
          position?: number | null
          relation_type?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_object_relations_child_object_id_fkey"
            columns: ["child_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_object_relations_parent_object_id_fkey"
            columns: ["parent_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_object_tags: {
        Row: {
          created_at: string
          learning_object_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          learning_object_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          learning_object_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_object_tags_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_object_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_objects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          keywords?: string[]
          language?: string
          metadata?: Json
          object_type: string
          objectives?: Json
          published?: boolean
          slug: string
          source_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          keywords?: string[]
          language?: string
          metadata?: Json
          object_type?: string
          objectives?: Json
          published?: boolean
          slug?: string
          source_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_outcomes: {
        Row: {
          competency_id: string | null
          created_at: string
          id: string
          learning_object_id: string
          metadata: Json
          position: number | null
          statement: string
          updated_at: string
        }
        Insert: {
          competency_id?: string | null
          created_at?: string
          id?: string
          learning_object_id: string
          metadata?: Json
          position?: number | null
          statement: string
          updated_at?: string
        }
        Update: {
          competency_id?: string | null
          created_at?: string
          id?: string
          learning_object_id?: string
          metadata?: Json
          position?: number | null
          statement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_outcomes_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_object_links: {
        Row: {
          created_at: string
          id: string
          learning_object_id: string
          legacy_id: string
          legacy_schema: string
          legacy_table: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_object_id: string
          legacy_id: string
          legacy_schema: string
          legacy_table: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_object_id?: string
          legacy_id?: string
          legacy_schema?: string
          legacy_table?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_object_links_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          review_status: string
          updated_at: string
          video_id: string | null
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position: number
          review_status?: string
          updated_at?: string
          video_id?: string | null
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          review_status?: string
          updated_at?: string
          video_id?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          course_id: string
          curricular_unit_id: string
          description: string | null
          id: string
          import_status: string
          language: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          status: string
          submitted_at: string
          submitted_by: string
          title: string
          updated_at: string
          youtube_playlist_id: string
        }
        Insert: {
          course_id: string
          curricular_unit_id: string
          description?: string | null
          id?: string
          import_status?: string
          language?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          title: string
          updated_at?: string
          youtube_playlist_id: string
        }
        Update: {
          course_id?: string
          curricular_unit_id?: string
          description?: string | null
          id?: string
          import_status?: string
          language?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          title?: string
          updated_at?: string
          youtube_playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facodi_playlist_course_unit_fk"
            columns: ["course_id", "curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["course_id", "id"]
          },
          {
            foreignKeyName: "playlists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          reason: string | null
          recommendation_type: string
          recommended_object_id: string
          score: number
          subject_object_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          recommendation_type: string
          recommended_object_id: string
          score: number
          subject_object_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          recommendation_type?: string
          recommended_object_id?: string
          score?: number
          subject_object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_recommended_object_id_fkey"
            columns: ["recommended_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_subject_object_id_fkey"
            columns: ["subject_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_suggestions: {
        Row: {
          attribution_declared: boolean
          author: string | null
          canonical_url: string
          created_at: string
          curricular_unit_id: string | null
          id: string
          language: string | null
          learning_object_id: string | null
          license: string | null
          license_declared: boolean
          note: string | null
          object_type: string
          provider: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screening: Json
          status: string
          submitted_by: string
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          attribution_declared: boolean
          author?: string | null
          canonical_url: string
          created_at?: string
          curricular_unit_id?: string | null
          id?: string
          language?: string | null
          learning_object_id?: string | null
          license?: string | null
          license_declared: boolean
          note?: string | null
          object_type?: string
          provider?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening?: Json
          status?: string
          submitted_by?: string
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          attribution_declared?: boolean
          author?: string | null
          canonical_url?: string
          created_at?: string
          curricular_unit_id?: string | null
          id?: string
          language?: string | null
          learning_object_id?: string | null
          license?: string | null
          license_declared?: boolean
          note?: string | null
          object_type?: string
          provider?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening?: Json
          status?: string
          submitted_by?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_suggestions_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_suggestions_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_matches: {
        Row: {
          algorithm_version: string | null
          confidence_score: number | null
          created_at: string
          created_by_mechanism: string | null
          evidence: Json
          explanation: string | null
          id: string
          match_type: string
          metadata: Json
          score: number
          source_object_id: string
          target_object_id: string
          updated_at: string
        }
        Insert: {
          algorithm_version?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by_mechanism?: string | null
          evidence?: Json
          explanation?: string | null
          id?: string
          match_type?: string
          metadata?: Json
          score: number
          source_object_id: string
          target_object_id: string
          updated_at?: string
        }
        Update: {
          algorithm_version?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by_mechanism?: string | null
          evidence?: Json
          explanation?: string | null
          id?: string
          match_type?: string
          metadata?: Json
          score?: number
          source_object_id?: string
          target_object_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "semantic_matches_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semantic_matches_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          learning_object_id: string
          owner_id: string
          pinned: boolean
          tags: string[]
          timestamp_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          learning_object_id: string
          owner_id?: string
          pinned?: boolean
          tags?: string[]
          timestamp_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          learning_object_id?: string
          owner_id?: string
          pinned?: boolean
          tags?: string[]
          timestamp_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label: string
          language: string
          metadata: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          language?: string
          metadata?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          language?: string
          metadata?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_videos: {
        Row: {
          created_at: string
          created_by: string | null
          curricular_unit_id: string
          id: string
          metadata: Json
          position: number
          title_override: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          curricular_unit_id: string
          id?: string
          metadata?: Json
          position?: number
          title_override?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          curricular_unit_id?: string
          id?: string
          metadata?: Json
          position?: number
          title_override?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_videos_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
            referencedColumns: ["id"]
          },
        ]
      }
      video_classifications: {
        Row: {
          confidence: number
          confidence_level: string | null
          course_id: string | null
          created_at: string
          curricular_unit_id: string | null
          evidence: Json
          id: string
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
          confidence?: number
          confidence_level?: string | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
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
          confidence_level?: string | null
          course_id?: string | null
          created_at?: string
          curricular_unit_id?: string | null
          evidence?: Json
          id?: string
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
            foreignKeyName: "video_classifications_curricular_unit_id_fkey"
            columns: ["curricular_unit_id"]
            isOneToOne: false
            referencedRelation: "curricular_units"
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
      video_progress: {
        Row: {
          completed_at: string | null
          last_position_seconds: number
          unit_video_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          last_position_seconds?: number
          unit_video_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          last_position_seconds?: number
          unit_video_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_unit_video_id_fkey"
            columns: ["unit_video_id"]
            isOneToOne: false
            referencedRelation: "unit_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_channels: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          language: string | null
          learning_object_id: string | null
          metadata: Json
          title: string | null
          updated_at: string
          youtube_channel_id: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          title?: string | null
          updated_at?: string
          youtube_channel_id: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string | null
          learning_object_id?: string | null
          metadata?: Json
          title?: string | null
          updated_at?: string
          youtube_channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_channels_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_video_metadata_checks: {
        Row: {
          checked_at: string
          id: string
          metadata: Json
          method: string
          observed_thumbnail_url: string | null
          observed_title: string
          reviewer_notes: string | null
          source_url: string
          verification_result: string
          youtube_video_id: string
        }
        Insert: {
          checked_at?: string
          id?: string
          metadata?: Json
          method: string
          observed_thumbnail_url?: string | null
          observed_title: string
          reviewer_notes?: string | null
          source_url: string
          verification_result: string
          youtube_video_id: string
        }
        Update: {
          checked_at?: string
          id?: string
          metadata?: Json
          method?: string
          observed_thumbnail_url?: string | null
          observed_title?: string
          reviewer_notes?: string | null
          source_url?: string
          verification_result?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_video_metadata_checks_youtube_video_id_fkey"
            columns: ["youtube_video_id"]
            isOneToOne: false
            referencedRelation: "youtube_videos"
            referencedColumns: ["youtube_video_id"]
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
          learning_object_id: string | null
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
          learning_object_id?: string | null
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
          learning_object_id?: string | null
          metadata?: Json
          published_at?: string | null
          status?: string
          tags?: string[]
          thumbnails?: Json
          title?: string | null
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_videos_learning_object_id_fkey"
            columns: ["learning_object_id"]
            isOneToOne: false
            referencedRelation: "learning_objects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_youtube_creator_catalog_v1: {
        Row: {
          catalogued_public_videos: number | null
          channel_title: string | null
          creator_source: string | null
          newly_verified_creator_videos: number | null
          verified_channel_handle: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      classify_resource_license: {
        Args: { p_license: string }
        Returns: string
      }
      create_course_structure: {
        Args: {
          p_child_object_ids?: string[]
          p_created_by?: string
          p_description?: string
          p_metadata?: Json
          p_slug?: string
          p_source_id?: string
          p_source_type?: string
          p_title: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_objects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_learning_object: {
        Args: {
          p_created_by?: string
          p_description?: string
          p_keywords?: string[]
          p_language?: string
          p_merge_metadata?: boolean
          p_metadata?: Json
          p_object_type: string
          p_objectives?: Json
          p_published?: boolean
          p_slug?: string
          p_source_id?: string
          p_source_type?: string
          p_source_url?: string
          p_status?: string
          p_tags?: string[]
          p_title: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_objects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_module_from_playlists: {
        Args: {
          p_created_by?: string
          p_description?: string
          p_metadata?: Json
          p_playlist_object_ids?: string[]
          p_slug?: string
          p_source_id?: string
          p_source_type?: string
          p_title: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_objects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_playlist_from_objects: {
        Args: {
          p_child_object_ids?: string[]
          p_created_by?: string
          p_description?: string
          p_metadata?: Json
          p_slug?: string
          p_source_id?: string
          p_source_type?: string
          p_title: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_objects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_analysis_job_status: {
        Args: { p_job_id: string }
        Returns: {
          completed_at: string
          created_at: string
          current_step: string
          error_code: string
          error_message: string
          id: string
          input_payload: Json
          job_type: string
          learning_object_id: string
          requested_by: string
          result_payload: Json
          started_at: string
          status: string
          updated_at: string
          video_id: string
        }[]
      }
      get_learning_object_children: {
        Args: { p_parent_object_id: string; p_relation_type?: string }
        Returns: {
          child_object: Json
          child_object_id: string
          confidence_score: number
          created_at: string
          parent_object_id: string
          relation_id: string
          relation_metadata: Json
          relation_position: number
          relation_type: string
          weight: number
        }[]
      }
      get_learning_object_parents: {
        Args: { p_child_object_id: string; p_relation_type?: string }
        Returns: {
          child_object_id: string
          confidence_score: number
          created_at: string
          parent_object: Json
          parent_object_id: string
          relation_id: string
          relation_metadata: Json
          relation_position: number
          relation_type: string
          weight: number
        }[]
      }
      get_learning_object_tree: {
        Args: {
          p_max_depth?: number
          p_relation_type?: string
          p_root_object_id: string
        }
        Returns: {
          child_object_id: string
          depth: number
          object: Json
          parent_object_id: string
          path: string[]
          relation_id: string
          relation_metadata: Json
          relation_position: number
          relation_type: string
        }[]
      }
      get_my_editorial_playlist_progress_v1: {
        Args: { p_slug: string }
        Returns: {
          completed_items: number
          completion_pct: number
          playlist_id: string
          playlist_title: string
          started_items: number
          total_items: number
        }[]
      }
      get_public_editorial_playlist_v2: {
        Args: { p_slug: string }
        Returns: {
          curricular_units: Json
          item_count: number
          items: Json
          language: string
          playlist_description: string
          playlist_id: string
          playlist_slug: string
          playlist_title: string
          verified_metadata_count: number
        }[]
      }
      is_facodi_editor: { Args: never; Returns: boolean }
      link_learning_objects: {
        Args: {
          p_child_object_id: string
          p_confidence_score?: number
          p_created_by?: string
          p_created_by_mechanism?: string
          p_metadata?: Json
          p_parent_object_id: string
          p_position?: number
          p_relation_type: string
          p_weight?: number
        }
        Returns: {
          child_object_id: string
          confidence_score: number | null
          created_at: string
          created_by: string | null
          created_by_mechanism: string | null
          id: string
          metadata: Json
          parent_object_id: string
          position: number | null
          relation_type: string
          updated_at: string
          weight: number | null
        }
        SetofOptions: {
          from: "*"
          to: "learning_object_relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_editor_youtube_review_queue_v1: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          channel_title: string
          course_unit_links: number
          metadata_checked: boolean
          reason: string
          source_url: string
          video_title: string
          youtube_id: string
        }[]
      }
      list_public_editorial_playlist_items_v1: {
        Args: { p_limit?: number; p_playlist_slug: string }
        Returns: {
          channel_title: string
          item_position: number
          video_language: string
          video_object_id: string
          video_title: string
          youtube_id: string
          youtube_url: string
        }[]
      }
      list_public_editorial_playlists_v1: {
        Args: { p_limit?: number; p_unit_code?: string }
        Returns: {
          item_count: number
          playlist_description: string
          playlist_id: string
          playlist_slug: string
          playlist_title: string
          unit_code: string
        }[]
      }
      normalize_resource_url: { Args: { p_url: string }; Returns: string }
      queue_analysis_job: {
        Args: {
          p_current_step?: string
          p_input_payload?: Json
          p_input_url?: string
          p_job_type: string
          p_learning_object_id?: string
          p_request_source?: string
          p_requested_by?: string
          p_video_id?: string
          p_youtube_video_id?: string
        }
        Returns: {
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
          learning_object_id: string | null
          request_source: string
          requested_by: string | null
          result_payload: Json
          started_at: string | null
          status: string
          updated_at: string
          video_id: string | null
          youtube_video_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "analysis_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reconcile_playlist_items: {
        Args: { p_playlist_id: string }
        Returns: number
      }
      record_analysis_result: {
        Args: {
          p_confidence_score?: number
          p_current_step?: string
          p_job_id: string
          p_learning_object_id: string
          p_payload?: Json
          p_provider?: string
          p_provider_model?: string
          p_result_type: string
          p_status?: string
          p_summary?: string
        }
        Returns: {
          confidence_score: number | null
          created_at: string
          id: string
          job_id: string | null
          learning_object_id: string
          payload: Json
          provider: string | null
          provider_model: string | null
          result_type: string
          summary: string | null
        }
        SetofOptions: {
          from: "*"
          to: "analysis_results"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_semantic_match: {
        Args: {
          p_algorithm_version?: string
          p_confidence_score?: number
          p_created_by_mechanism?: string
          p_evidence?: Json
          p_explanation?: string
          p_match_type?: string
          p_metadata?: Json
          p_score?: number
          p_source_object_id: string
          p_target_object_id: string
        }
        Returns: {
          algorithm_version: string | null
          confidence_score: number | null
          created_at: string
          created_by_mechanism: string | null
          evidence: Json
          explanation: string | null
          id: string
          match_type: string
          metadata: Json
          score: number
          source_object_id: string
          target_object_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "semantic_matches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_playlist: {
        Args: {
          p_decision: string
          p_playlist_id: string
          p_review_note?: string
        }
        Returns: string
      }
      review_resource_suggestion: {
        Args: {
          p_decision: string
          p_review_note?: string
          p_suggestion_id: string
        }
        Returns: string
      }
      review_study_blueprint: {
        Args: { p_decision: string; p_id: string; p_note?: string }
        Returns: string
      }
      search_public_catalog_v1: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_types?: string[]
        }
        Returns: {
          id: string
          language: string
          object_type: string
          relevance: number
          slug: string
          source_url: string
          summary: string
          title: string
        }[]
      }
      search_public_resources_v2: {
        Args: {
          p_language?: string
          p_object_type?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_tag?: string
        }
        Returns: Json
      }
      submit_playlist: {
        Args: {
          p_course_id: string
          p_curricular_unit_id: string
          p_description?: string
          p_language?: string
          p_title: string
          p_youtube_playlist_id: string
          p_youtube_video_ids?: string[]
        }
        Returns: string
      }
      unlink_learning_objects: {
        Args: {
          p_child_object_id: string
          p_parent_object_id: string
          p_relation_type?: string
        }
        Returns: number
      }
      update_learning_object_metadata: {
        Args: {
          p_description?: string
          p_keywords?: string[]
          p_learning_object_id: string
          p_merge_metadata?: boolean
          p_metadata?: Json
          p_objectives?: Json
          p_published?: boolean
          p_status?: string
          p_tags?: string[]
          p_title?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keywords: string[]
          language: string
          metadata: Json
          object_type: string
          objectives: Json
          published: boolean
          slug: string
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_objects"
          isOneToOne: true
          isSetofReturn: false
        }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
} as const
