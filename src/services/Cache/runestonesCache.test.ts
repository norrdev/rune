import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Runestone } from '../../types';
import { runestonesCache } from './runestonesCache';
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
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.spyOn(supabaseRunestones, 'getAllRunestones').mockResolvedValue(sampleStones);
    vi.spyOn(supabaseRunestones, 'getVisibleRunestones').mockResolvedValue(sampleStones);
    await runestonesCache.clearCache();
  });

  it('retrieves all runestones from cache or supabase if count is less than total', async () => {
    const allStones = await runestonesCache.getAllRunestones();
    expect(allStones).toEqual(sampleStones);
    expect(supabaseRunestones.getAllRunestones).toHaveBeenCalled();
  });

  it('searches runestones by matching text', async () => {
    const emptyResults = await runestonesCache.searchRunestones('   ');
    expect(emptyResults).toEqual([]);

    await runestonesCache.getAllRunestones();
    const results = await runestonesCache.searchRunestones('Risbyle');
    expect(results).toHaveLength(1);
    expect(results[0].signature_text).toBe('U 160');
  });

  it('fetches runestone by slug', async () => {
    const stone = await runestonesCache.getRunestoneBySlug('U_160');
    expect(stone?.signature_text).toBe('U 160');

    const notFound = await runestonesCache.getRunestoneBySlug('unknown-slug');
    expect(notFound).toBeNull();
  });

  it('filters runestones by geographic bounds', async () => {
    // Bounds: [west, south, east, north]
    const täbyBounds: [number, number, number, number] = [17.5, 59.0, 18.5, 60.0];
    const stones = await runestonesCache.getRunestonesByBounds(täbyBounds);
    expect(stones.length).toBeGreaterThanOrEqual(1);
    expect(stones.some((s: Runestone) => s.signature_text === 'U 160')).toBe(true);
  });

  it('updates and clears cache properly', async () => {
    await runestonesCache.updateCache([sampleStones[0]]);
    await runestonesCache.clearCache();
  });
});

