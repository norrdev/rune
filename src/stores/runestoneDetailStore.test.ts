import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runestoneDetailStore } from './runestoneDetailStore';
import { runestonesCache } from '../services/Cache/runestonesCache';
import type { Runestone } from '../types';

describe('runestoneDetailStore', () => {
  const sampleStone: Runestone = {
    id: 10,
    signature_text: 'U 10',
    found_location: 'Location',
    parish: 'Parish',
    district: 'District',
    municipality: 'Municipality',
    current_location: 'Current',
    material: 'Granite',
    rune_type: 'Runestone',
    dating: 'Viking',
    style: 'Pr2',
    carver: 'Öpir',
    latitude: 59.1,
    longitude: 18.1,
    lost: false,
    ornamental: false,
    recent: false,
    slug: 'U_10',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    runestoneDetailStore.clear();
  });

  it('initializes and clears state properly', () => {
    runestoneDetailStore.clear();
    expect(runestoneDetailStore.runestone).toBeNull();
    expect(runestoneDetailStore.loading).toBe(true);
    expect(runestoneDetailStore.error).toBeNull();
    expect(runestoneDetailStore.currentSlug).toBeNull();
  });

  it('sets error when no slug is provided', async () => {
    await runestoneDetailStore.loadRunestoneBySlug(undefined);
    expect(runestoneDetailStore.error).toBe('No slug provided');
    expect(runestoneDetailStore.loading).toBe(false);
    expect(runestoneDetailStore.runestone).toBeNull();
  });

  it('loads runestone by slug successfully', async () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockResolvedValueOnce(sampleStone);

    await runestoneDetailStore.loadRunestoneBySlug('U_10');
    expect(runestoneDetailStore.runestone).toEqual(sampleStone);
    expect(runestoneDetailStore.loading).toBe(false);
    expect(runestoneDetailStore.error).toBeNull();
    expect(runestoneDetailStore.currentSlug).toBe('U_10');
  });

  it('handles runestone not found', async () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockResolvedValueOnce(null);

    await runestoneDetailStore.loadRunestoneBySlug('unknown');
    expect(runestoneDetailStore.runestone).toBeNull();
    expect(runestoneDetailStore.error).toBe('Runestone not found');
    expect(runestoneDetailStore.loading).toBe(false);
  });

  it('handles fetch errors gracefully', async () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockRejectedValueOnce(new Error('Network error'));

    await runestoneDetailStore.loadRunestoneBySlug('error_slug');
    expect(runestoneDetailStore.error).toBe('Failed to load runestone');
    expect(runestoneDetailStore.loading).toBe(false);
  });

  it('ignores stale response when navigation changes', async () => {
    let resolveFirst: (val: any) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockImplementation((slug) => {
      if (slug === 'slug-1') return firstPromise as any;
      return Promise.resolve({ ...sampleStone, slug: 'slug-2' });
    });

    // Start first load
    const p1 = runestoneDetailStore.loadRunestoneBySlug('slug-1');
    // Start second load immediately
    const p2 = runestoneDetailStore.loadRunestoneBySlug('slug-2');

    await p2;
    expect(runestoneDetailStore.currentSlug).toBe('slug-2');
    expect(runestoneDetailStore.runestone?.slug).toBe('slug-2');

    // Now resolve first
    resolveFirst!({ ...sampleStone, slug: 'slug-1' });
    await p1;

    // Should remain slug-2 because slug-1 was stale
    expect(runestoneDetailStore.currentSlug).toBe('slug-2');
    expect(runestoneDetailStore.runestone?.slug).toBe('slug-2');
  });
});

