import { supabase } from './supabase';
import type { Runestone } from '../types';
import { authStore } from '../stores/authStore';

class SupabaseRunestonesService {
  private static instance: SupabaseRunestonesService;

  private constructor() { }

  public static getInstance(): SupabaseRunestonesService {
    if (!SupabaseRunestonesService.instance) {
      SupabaseRunestonesService.instance = new SupabaseRunestonesService();
    }
    return SupabaseRunestonesService.instance;
  }

  async getVisibleRunestones(west?: number, south?: number, east?: number, north?: number): Promise<Runestone[]> {
    const { data, error } = await supabase.rpc('get_visible_runestones', {
      p_west: west,
      p_south: south,
      p_east: east,
      p_north: north,
    });

    if (error) {
      console.error('Error fetching runestones:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Runestone) => ({
      id: row.id,
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
      latitude: row.latitude,
      longitude: row.longitude,
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
    }));
  }

  async getAllRunestones(): Promise<Runestone[]> {
    const { data, error } = await supabase.rpc('get_all_runestones');

    if (error) {
      console.error('Error fetching runestones:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Runestone) => ({
      id: row.id,
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
      latitude: row.latitude,
      longitude: row.longitude,
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
    }));
  }

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

    return data;
  }

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

    return data;
  }

  async isVisited(runestoneId: number): Promise<boolean> {
    const user = authStore.user;
    if (!user) {
      console.warn('isVisited: User not logged in');
      return false;
    }
    const { data, error } = await supabase.rpc('is_runestone_visited', {
      p_signature_id: runestoneId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error checking if runestone is visited:', error);
      throw error;
    }

    return data;
  }

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

    return data;
  }
}

export const supabaseRunestones = SupabaseRunestonesService.getInstance();
