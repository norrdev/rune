import { describe, it, expect, vi, beforeEach } from 'vitest';
import { visitedRunestonesStore } from './visitedRunestonesStore';
import { supabaseRunestones } from '../services/supabaseRunestones';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { authStore } from './authStore';
import type { Runestone } from '../types';

describe('visitedRunestonesStore', () => {
  const sampleStone: Runestone = {
    id: 42,
    signature_text: 'U 42',
    found_location: 'Location',
    parish: 'Parish',
    district: '',
    municipality: '',
    current_location: '',
    material: 'Granite',
    rune_type: 'Runestone',
    dating: 'Viking',
    style: '',
    carver: '',
    latitude: 59.1,
    longitude: 18.1,
    lost: false,
    ornamental: false,
    recent: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    visitedRunestonesStore.clearVisitedRunestones();
    authStore.setUser(null);
  });

  it('calculates counts and completion percentage correctly', () => {
    visitedRunestonesStore.setTotalRunestonesCount(100);
    expect(visitedRunestonesStore.visitedCount).toBe(0);
    expect(visitedRunestonesStore.completionPercentage).toBe(0);

    visitedRunestonesStore.addVisitedRunestone(42);
    expect(visitedRunestonesStore.visitedCount).toBe(1);
    expect(visitedRunestonesStore.isVisited(42)).toBe(true);
    expect(visitedRunestonesStore.isRunestoneVisited(42)).toBe(true);
    expect(visitedRunestonesStore.isVisited(99)).toBe(false);
    expect(visitedRunestonesStore.completionPercentage).toBe(1);

    visitedRunestonesStore.removeVisitedRunestone(42);
    expect(visitedRunestonesStore.visitedCount).toBe(0);
  });

  it('applies visited status to a runestones array', () => {
    visitedRunestonesStore.addVisitedRunestone(42);
    const stones: Runestone[] = [
      { ...sampleStone, id: 42 },
      { ...sampleStone, id: 43 },
    ];

    const withStatus = visitedRunestonesStore.applyVisitedStatus(stones);
    expect(withStatus[0].visited).toBe(true);
    expect(withStatus[1].visited).toBe(false);
  });

  describe('markAsVisited / unmarkAsVisited', () => {
    it('does nothing if user is not fully authenticated', async () => {
      authStore.setUser(null);
      const res1 = await visitedRunestonesStore.markAsVisited(42);
      expect(res1).toBe(false);

      const res2 = await visitedRunestonesStore.unmarkAsVisited(42);
      expect(res2).toBe(false);
    });

    it('marks runestone as visited when user is authenticated', async () => {
      authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
      vi.spyOn(supabaseRunestones, 'markAsVisited').mockResolvedValueOnce(true);

      const success = await visitedRunestonesStore.markAsVisited(42);
      expect(success).toBe(true);
      expect(visitedRunestonesStore.isVisited(42)).toBe(true);
    });

    it('unmarks runestone as visited when user is authenticated', async () => {
      authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
      visitedRunestonesStore.addVisitedRunestone(42);

      vi.spyOn(supabaseRunestones, 'deleteVisited').mockResolvedValueOnce(true);

      const success = await visitedRunestonesStore.unmarkAsVisited(42);
      expect(success).toBe(true);
      expect(visitedRunestonesStore.isVisited(42)).toBe(false);
    });

    it('handles markAsVisited failure', async () => {
      authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
      vi.spyOn(supabaseRunestones, 'markAsVisited').mockRejectedValueOnce(new Error('Fail'));

      const success = await visitedRunestonesStore.markAsVisited(42);
      expect(success).toBe(false);
      expect(visitedRunestonesStore.error).toBe('Failed to mark runestone as visited');
    });
  });

  describe('fetchVisitedRunestones', () => {
    it('clears visited stones if user is not authenticated', async () => {
      visitedRunestonesStore.addVisitedRunestone(42);
      authStore.setUser(null);

      await visitedRunestonesStore.fetchVisitedRunestones();
      expect(visitedRunestonesStore.visitedCount).toBe(0);
    });

    it('fetches visited runestones for authenticated user', async () => {
      authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
      vi.spyOn(supabaseRunestones, 'getAllVisitedRunestones').mockResolvedValueOnce([
        { ...sampleStone, id: 101 },
      ]);

      await visitedRunestonesStore.fetchVisitedRunestones();
      expect(visitedRunestonesStore.isVisited(101)).toBe(true);
    });
  });

  describe('fetchVisitedRunestoneDetails', () => {
    it('loads runestone details from cache', async () => {
      visitedRunestonesStore.addVisitedRunestone(42);
      vi.spyOn(runestonesCache, 'getAllRunestones').mockResolvedValueOnce([sampleStone]);

      await visitedRunestonesStore.fetchVisitedRunestoneDetails();
      expect(visitedRunestonesStore.visitedRunestoneDetails).toEqual([sampleStone]);
    });
  });
});

