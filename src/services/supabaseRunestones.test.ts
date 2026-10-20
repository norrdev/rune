import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabase';
import { supabaseRunestones } from './supabaseRunestones';
import { authStore } from '../stores/authStore';

describe('supabaseRunestones', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVisibleRunestones', () => {
    it('fetches and maps visible runestones within bounds', async () => {
      const mockRows = [
        {
          id: 1,
          signature_text: 'U 1',
          found_location: 'Location 1',
          lost: 1,
          ornamental: 0,
          recent: 0,
          latitude: 59.5,
          longitude: 18.2,
        },
      ];

      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: mockRows,
        error: null,
      } as any);

      const result = await supabaseRunestones.getVisibleRunestones(18, 59, 19, 60);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].signature_text).toBe('U 1');
      expect(result[0].lost).toBe(true);
      expect(result[0].ornamental).toBe(false);
    });

    it('throws error when rpc fails', async () => {
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('RPC error'),
      } as any);

      await expect(supabaseRunestones.getVisibleRunestones()).rejects.toThrow('RPC error');
    });
  });

  describe('getAllRunestones', () => {
    it('fetches and maps all runestones', async () => {
      const mockRows = [
        {
          id: 10,
          signature_text: 'Sö 10',
          lost: 0,
          ornamental: 1,
          recent: 1,
        },
      ];

      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: mockRows,
        error: null,
      } as any);

      const result = await supabaseRunestones.getAllRunestones();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(10);
      expect(result[0].ornamental).toBe(true);
      expect(result[0].recent).toBe(true);
    });

    it('returns empty array if non-array data is returned', async () => {
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await supabaseRunestones.getAllRunestones();
      expect(result).toEqual([]);
    });

    it('throws error when rpc fails', async () => {
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('Database down'),
      } as any);

      await expect(supabaseRunestones.getAllRunestones()).rejects.toThrow('Database down');
    });
  });

  describe('getAllVisitedRunestones', () => {
    it('returns empty array when user is not logged in', async () => {
      authStore.setUser(null);
      const result = await supabaseRunestones.getAllVisitedRunestones();
      expect(result).toEqual([]);
    });

    it('fetches visited runestones when user is logged in', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: [{ id: 100, signature_text: 'U 100' }],
        error: null,
      } as any);

      const result = await supabaseRunestones.getAllVisitedRunestones();
      expect(result).toEqual([{ id: 100, signature_text: 'U 100' }]);
    });

    it('throws when rpc fails for logged in user', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('Error fetching visited'),
      } as any);

      await expect(supabaseRunestones.getAllVisitedRunestones()).rejects.toThrow(
        'Error fetching visited',
      );
    });
  });

  describe('markAsVisited', () => {
    it('returns false when user is not logged in', async () => {
      authStore.setUser(null);
      const success = await supabaseRunestones.markAsVisited(1);
      expect(success).toBe(false);
    });

    it('marks runestone as visited when user is logged in', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const success = await supabaseRunestones.markAsVisited(1);
      expect(success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('mark_runestone_as_visited', {
        p_signature_id: 1,
        p_user_id: 'user-123',
      });
    });

    it('throws on error', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('Failed to mark'),
      } as any);

      await expect(supabaseRunestones.markAsVisited(1)).rejects.toThrow('Failed to mark');
    });
  });

  describe('isVisited', () => {
    it('returns false when user is not logged in', async () => {
      authStore.setUser(null);
      const visited = await supabaseRunestones.isVisited(1);
      expect(visited).toBe(false);
    });

    it('checks visit status when logged in', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const visited = await supabaseRunestones.isVisited(1);
      expect(visited).toBe(true);
    });

    it('throws on error', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('Check error'),
      } as any);

      await expect(supabaseRunestones.isVisited(1)).rejects.toThrow('Check error');
    });
  });

  describe('deleteVisited', () => {
    it('returns false when user is not logged in', async () => {
      authStore.setUser(null);
      const success = await supabaseRunestones.deleteVisited(1);
      expect(success).toBe(false);
    });

    it('deletes visited status when logged in', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const success = await supabaseRunestones.deleteVisited(1);
      expect(success).toBe(true);
    });

    it('throws on error', async () => {
      authStore.setUser({ id: 'user-123' } as any);
      vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: null,
        error: new Error('Delete error'),
      } as any);

      await expect(supabaseRunestones.deleteVisited(1)).rejects.toThrow('Delete error');
    });
  });
});

