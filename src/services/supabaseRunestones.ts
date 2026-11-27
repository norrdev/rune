import { supabase } from './supabase';
import type { Runestone, RunestoneRow } from '../types';
import { authStore } from '../stores/authStore';

const mapRowToRunestone = (row: Partial<RunestoneRow>): Runestone => ({
  id: row.id ?? 0,
  signature_text: row.signature_text || '',
  found_location: row.found_location || '',
  parish: row.parish || '',
  district: row.district || '',
  municipality: row.municipality || '',
  current_location: row.current_location || '',
  material: row.material || '',
  material_type: row.material_type || '',
  rune_type: row.rune_type || '',
  dating: row.dating || '',
  style: row.style || '',
  carver: row.carver || '',
  latitude: row.latitude ?? 0,
  longitude: row.longitude ?? 0,
  english_translation: row.english_translation || '',
  swedish_translation: row.swedish_translation || '',
  norse_text: row.norse_text || '',
  transliteration: row.transliteration || '',
  lost: Boolean(row.lost),
  ornamental: Boolean(row.ornamental),
  recent: Boolean(row.recent),
  slug: row.slug || '',
  link_url: row.link_url || '',
  direct_url: row.direct_url || '',
});

// p_user_id is ignored by the database (it uses auth.uid()); still sent so this build
// also works against the functions from before migration 20261127000000.
export const supabaseRunestones = {
  async getAllRunestones(): Promise<Runestone[]> {
    const { data, error } = await supabase.rpc('get_all_runestones');

    if (error) {
      console.error('Error fetching runestones:', error);
      throw error;
    }

    return Array.isArray(data) ? (data as RunestoneRow[]).map(mapRowToRunestone) : [];
  },

  async getAllVisitedRunestones(): Promise<Runestone[]> {
    const user = authStore.user;
    if (!user) {
      console.warn('getAllVisitedRunestones: User not logged in');
      return [];
    }
    const { data, error } = await supabase.rpc('get_all_visited_runestones', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching visited runestones:', error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  },

  async markAsVisited(runestoneId: number): Promise<boolean> {
    const user = authStore.user;
    if (!user) {
      console.warn('markAsVisited: User not logged in');
      return false;
    }
    const { data, error } = await supabase.rpc('mark_runestone_as_visited', {
      p_signature_id: runestoneId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error marking runestone as visited:', error);
      throw error;
    }

    return Boolean(data);
  },

  async deleteVisited(runestoneId: number): Promise<boolean> {
    const user = authStore.user;
    if (!user) {
      console.warn('deleteVisited: User not logged in');
      return false;
    }
    const { data, error } = await supabase.rpc('delete_runestone_visited', {
      p_signature_id: runestoneId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error deleting runestone visited record:', error);
      throw error;
    }

    return Boolean(data);
  },
};
