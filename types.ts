
export enum Category {
  ENGINEERING = 'Engineering',
  MATHEMATICS = 'Mathematics',
  COMPUTER_SCIENCE = 'Computer Science',
  ARTS_UI = 'Arts & UI',
  ETHICS = 'Ethics & Governance',
  MANAGEMENT = 'Management',
  DESIGN = 'Design',
  HUMANITIES = 'Humanities',
  COMMUNICATION = 'Communication'
}

export enum Difficulty {
  FOUNDATIONAL = 'Foundational (01)',
  INTERMEDIATE = 'Intermediate (02)',
  ADVANCED = 'Advanced (03)',
  EXPERT = 'Expert (04)'
}

export interface CurricularUnit {
  id: string;
  code?: string;
  slug?: string;
  name: string;
  description: string;
  content?: string;
  contentUrl?: string;
  syllabusUrl?: string;
  ects: number;
  semester: number;
  year: number;
  category: Category;
  difficulty: Difficulty;
  duration: string;
  contributor: string;
  tags: string[];
  courseId: string;
  courseCode?: string;
  prerequisites?: string[];
  // Odoo-enriched fields
  unitCode?: string;        // x_facodi_unit_code e.g. '19411003'
  sectionName?: string;     // category_id name e.g. '1o Ano - 1o Semestre'
  websiteUrl?: string;      // website_absolute_url on Odoo
  videoUrl?: string;        // video_url on Odoo
}

export interface Course {
  id: string;
  code?: string;
  slug?: string;
  title: string;
  description: string;
  ects: number;
  semesters: number;
  institution: string;
  school: string;
  degreeType: 'bachelor' | 'master' | 'other';
  language: string;
  longDescription: string;
  // Odoo-enriched fields
  websiteUrl?: string;         // website_absolute_url on Odoo
  curriculumVersion?: string;  // x_facodi_curriculum_version
  contentLicense?: string;     // x_facodi_content_license
}

export interface Playlist {
  id: string;
  slug?: string;
  title: string;
  description: string;
  units: string[]; 
  estimatedHours: number;
  creator: string;
  courseId?: string;
  unitId?: string;
  course_code?: string;
  unit_code?: string;
}

export interface ContentPage {
  slug: string;
  titlePt: string;
  titleEn?: string;
  bodyPt: string;
  bodyEn?: string;
  published: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  avatar_path: string | null;
  role: 'user' | 'editor' | 'admin';
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface PublicPlaylist {
  id: string;
  name: string;
  slug: string;
  description: string;
  courseCode?: string;
  unitCode?: string;
  videoCount: number;
  totalDurationSeconds?: number;
}

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  channelName: string;
  durationSeconds?: number;
  thumbnailUrl: string;
  language: string;
  categoryId?: string;
  category?: VideoCategory;
  playlistId?: string;
  playlistName?: string;
  playlistSlug?: string;
  position?: number;
}

export interface FilterState {
  category: Category | 'All';
  difficulty: Difficulty | 'All';
  search: string;
  onlySaved: boolean;
  courseId: string | 'All';
  year: number | 'All';
  semester: number | 'All';
}

export interface EditorApplication {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  specialty_area?: string | null;
  experience_summary?: string | null;
  relevant_links?: string[] | null;
  availability?: string | null;
  motivation?: string | null;
  portfolio_url?: string | null;
  guidelines_accepted: boolean;
  consent_privacy: boolean;
  status: 'pending' | 'approved' | 'rejected';
  source_page: string;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSubmission {
  id: string;
  content_type: 'video' | 'article' | 'interactive' | 'other';
  url?: string | null;
  youtube_video_id?: string | null;
  suggested_title: string;
  summary?: string | null;
  course_id?: string | null;
  unit_id?: string | null;
  topic?: string | null;
  pedagogical_reason?: string | null;
  tags: string[];
  additional_notes?: string | null;
  author_id?: string | null;
  author_email?: string | null;
  author_name?: string | null;
  status: 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'needs_changes' | 'published';
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  assigned_to?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// ============= YouTube Channel Curation Pipeline Types =============

export interface ChannelIdentity {
  channelId: string;
  username: string;
  email: string;
  handle?: string;
  url?: string;
}

export interface ChannelVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number; // in seconds
  publishedAt: string; // ISO 8601
  channelName: string;
  viewCount: number;
  tags?: string[];
  isProcessed?: boolean;
}

export interface VideoDiscoveryState {
  channelId: string | null;
  channelName?: string;
  status: 'idle' | 'importing' | 'discovering' | 'analyzing' | 'mapping' | 'reviewing' | 'publishing';
  videos: ChannelVideo[];
  selectedVideoIds: string[];
  analysisResults: Map<string, AIAnalysisResult>;
  playlistMappings: Map<string, string>; // videoId -> playlistId
  error: string | null;
  message: string | null;
}

export interface AIAnalysisResult {
  videoId: string;
  topics: string[];
  difficulty: Difficulty;
  pedagogicalScore: number; // 0-1
  pedagogicalJustification?: string;
  playlistSuggestions: PlaylistSuggestion[];
  curatorNotes?: string;
}

export interface PlaylistSuggestion {
  playlistId: string;
  playlistName: string;
  confidence: number; // 0-1
  reason: string;
}

export interface PublishRequest {
  channelId: string;
  videoIds: string[];
  mappings: Record<string, string>; // videoId -> playlistId
  curatorNotes?: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  publishedCount: number;
  affectedPlaylists: string[];
  timestamp: string;
  notes?: string;
}
