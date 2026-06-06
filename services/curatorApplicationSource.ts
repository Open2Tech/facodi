import { supabase } from './supabase';
import { EditorApplication } from '../types';
import { Database } from './supabase.types';

type EditorApplicationRow = Database['public']['Tables']['editor_applications']['Row'];
type EditorApplicationInsert = Database['public']['Tables']['editor_applications']['Insert'];

/**
 * Service for managing curator candidature applications.
 * Handles submission, retrieval, and status tracking of editor applications.
 */

export interface CuratorApplicationData {
  full_name: string;
  email: string;
  specialty_area?: string;
  experience_summary?: string;
  relevant_links?: string[];
  availability?: string;
  motivation?: string;
  portfolio_url?: string;
  guidelines_accepted: boolean;
  consent_privacy: boolean;
}

export interface ApplicationStatus {
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNotes?: string;
}

/**
 * Submit a new curator application.
 * Validates against duplicates for the current user.
 */
export async function submitCuratorApplication(data: CuratorApplicationData): Promise<EditorApplication | null> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('auth_required');
    }

    // Check for existing active application
    const { data: existingApp, error: checkError } = await supabase
      .from('editor_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingApp) {
      throw new Error('application_already_exists');
    }

    // Insert new application
    const { data: newApp, error: insertError } = await supabase
      .from('editor_applications')
      .insert({
        user_id: user.id,
        email: data.email,
        full_name: data.full_name,
        specialty_area: data.specialty_area,
        experience_summary: data.experience_summary,
        relevant_links: data.relevant_links || [],
        availability: data.availability,
        motivation: data.motivation,
        portfolio_url: data.portfolio_url,
        guidelines_accepted: data.guidelines_accepted,
        consent_privacy: data.consent_privacy,
        status: 'pending',
        source_page: 'curator-apply',
      } as EditorApplicationInsert)
      .select()
      .single();

    if (insertError || !newApp) {
      throw insertError || new Error('insert_failed');
    }

    return mapEditorApplicationRow(newApp);
  } catch (error) {
    console.error('submitCuratorApplication error:', error);
    throw error;
  }
}

/**
 * Get the current user's curator application (if any).
 */
export async function getUserApplication(): Promise<EditorApplication | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('editor_applications')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      throw error;
    }

    return data ? mapEditorApplicationRow(data) : null;
  } catch (error) {
    console.error('getUserApplication error:', error);
    throw error;
  }
}

/**
 * List all applications (admin only).
 * Filtered by status with pagination support.
 */
export async function listApplications(
  status?: 'pending' | 'approved' | 'rejected',
  limit = 50,
  offset = 0
): Promise<{ applications: EditorApplication[]; total: number }> {
  try {
    let query = supabase
      .from('editor_applications')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      applications: (data || []).map(mapEditorApplicationRow),
      total: count || 0,
    };
  } catch (error) {
    console.error('listApplications error:', error);
    throw error;
  }
}

/**
 * Update application status (admin only).
 * Used for approving or rejecting applications.
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'approved' | 'rejected',
  reviewNotes?: string
): Promise<EditorApplication | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('auth_required');
    }

    const { data, error } = await supabase
      .from('editor_applications')
      .update({
        status,
        review_notes: reviewNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data ? mapEditorApplicationRow(data) : null;
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    throw error;
  }
}

/**
 * Map Supabase row to frontend EditorApplication type.
 */
function mapEditorApplicationRow(row: EditorApplicationRow): EditorApplication {
  return {
    id: row.id,
    user_id: row.user_id || undefined,
    email: row.email,
    full_name: row.full_name,
    specialty_area: row.specialty_area,
    experience_summary: row.experience_summary,
    relevant_links: row.relevant_links,
    availability: row.availability,
    motivation: row.motivation,
    portfolio_url: row.portfolio_url,
    guidelines_accepted: row.guidelines_accepted ?? false,
    consent_privacy: row.consent_privacy,
    status: row.status as 'pending' | 'approved' | 'rejected',
    source_page: row.source_page,
    review_notes: row.review_notes,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Error codes for UI error handling:
 * - auth_required: User not authenticated
 * - application_already_exists: User has an active (pending/approved) application
 * - insert_failed: Database insert failed
 * - PGRST116: No rows found (from Supabase)
 */
