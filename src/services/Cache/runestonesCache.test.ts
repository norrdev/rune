import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Runestone } from '../../types';
import { RunestonesCache } from './runestonesCache';
import { supabaseRunestones } from '../supabaseRunestones';

const sampleStones: Runestone[] = [
  {
    id: 1,
    signature_text: 'U 160',
    found_location: 'Risbyle',
    parish: 'Täby',
    district: 'Danderyd',
    municipality: 'Täby',
    current_location: 'Risbyle',
    material: 'Granite',
    material_type: 'Granite',
    rune_type: 'Runestone',
    dating: 'Viking Age',
    style: 'Pr2',
    carver: 'Ulv i Borresta',
    latitude: 59.4891,
    longitude: 18.0673,
    english_translation: 'In memory of Ulf',
    swedish_translation: 'Till minne av Ulf',
    norse_text: 'Norse text',
    transliteration: 'Translit',
    lost: false,
    ornamental: false,
    recent: false,
    slug: 'U_160',
  },
  {
    id: 2,
    signature_text: 'Ög 136',
    found_location: 'Rök',
    parish: 'Rök',
    district: 'Lysing',
    municipality: 'Ödeshög',
    current_location: 'Rök church',
    material: 'Schist',
    rune_type: 'Runestone',
    dating: 'Viking Age',
    style: 'Older',
    carver: 'Varin',
    latitude: 58.2952,
    longitude: 14.7752,
    lost: false,
    ornamental: false,
    recent: false,
    slug: 'Og_136',
  },
];

describe('runestonesCache', () => {
  let runestonesCache: RunestonesCache;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabaseRunestones, 'getAllRunestones').mockResolvedValue(sampleStones);
    localStorage.clear();
    runestonesCache = new RunestonesCache();
  });

  it('loads from supabase once, then serves from the cache', async () => {
    expect(await runestonesCache.getAllRunestones()).toEqual(sampleStones);
    expect(await runestonesCache.getAllRunestones()).toEqual(sampleStones);
    expect(supabaseRunestones.getAllRunestones).toHaveBeenCalledTimes(1);

    // A fresh start with the same app version reuses the cache
    await new RunestonesCache().getAllRunestones();
    expect(supabaseRunestones.getAllRunestones).toHaveBeenCalledTimes(1);
  });

  it('replaces the cache when the app version changes, dropping removed stones', async () => {
    await runestonesCache.getAllRunestones();
    localStorage.setItem('runestones-cache-version', '0.0.0');
    vi.mocked(supabaseRunestones.getAllRunestones).mockResolvedValue([sampleStones[1]]);

    expect(await new RunestonesCache().getAllRunestones()).toEqual([sampleStones[1]]);
  });

  it('retries after a failed load', async () => {
    vi.mocked(supabaseRunestones.getAllRunestones).mockRejectedValueOnce(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runestonesCache.getAllRunestones()).rejects.toThrow('offline');
    expect(await runestonesCache.getAllRunestones()).toEqual(sampleStones);
  });

  it('searches runestones by matching text', async () => {
    expect(await runestonesCache.searchRunestones('   ')).toEqual([]);

    const results = await runestonesCache.searchRunestones('Risbyle');
    expect(results).toHaveLength(1);
    expect(results[0].signature_text).toBe('U 160');
  });

  it('fetches runestone by slug', async () => {
    const stone = await runestonesCache.getRunestoneBySlug('U_160');
    expect(stone?.signature_text).toBe('U 160');
    expect(await runestonesCache.getRunestoneBySlug('unknown-slug')).toBeNull();
  });
});
