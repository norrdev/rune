import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabaseRunestones } from './supabaseRunestones';
import { Runestone } from '../types';

const TOTAL_RUNESTONES = 6815;

interface RunestonesDB extends DBSchema {
  runestones: {
    key: number;
    value: Runestone;
    indexes: {
      'by-coordinates': [number, number];
      'by-slug': string;
    };
  };
}

class RunestonesCache {
  private db: Promise<IDBPDatabase<RunestonesDB>>;
  private lastUpdate: number = 0;
  private CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year
  private isInitialized = false;
  private cachedBounds: Map<string, [number, number, number, number]> = new Map();

  constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB<RunestonesDB>('runestones-cache', 2, {
      upgrade(db) {
        const store = db.createObjectStore('runestones', { keyPath: 'id' });
        store.createIndex('by-coordinates', ['latitude', 'longitude']);
        store.createIndex('by-slug', ['slug']);
      },
    });
  }

  private async initializeCache() {
    if (this.isInitialized) return;

    const db = await this.db;

    // Check if we already have data in the cache
    const existingData = await db.count('runestones');

    if (existingData < TOTAL_RUNESTONES) {
      try {
        // Load all runestones from Supabase without bounds restriction
        const allRunestones = await supabaseRunestones.getAllRunestones();
        await this.updateCache(allRunestones);

        // Mark that we have all data cached by setting a special bounds entry
        this.cachedBounds.set('*', [-180, -90, 180, 90]); // Global bounds
      } catch (error) {
        console.error('Failed to initialize cache with all runestones:', error);
      }
    } else {
      // We already have data, assume it's complete and set global bounds
      this.cachedBounds.set('*', [-180, -90, 180, 90]);
    }

    this.isInitialized = true;
  }

  private boundsKey(bounds: [number, number, number, number]): string {
    return bounds.join(',');
  }

  private boundsOverlap(bounds1: [number, number, number, number], bounds2: [number, number, number, number]): boolean {
    const [west1, south1, east1, north1] = bounds1;
    const [west2, south2, east2, north2] = bounds2;
    return !(east1 < west2 || west1 > east2 || north1 < south2 || south1 > north2);
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }

  async getAllRunestones(): Promise<Runestone[]> {
    await this.initializeCache();

    const db = await this.db;
    const allStones = await db.getAll('runestones');
    if (allStones.length < TOTAL_RUNESTONES) {
      const allRunestones = await supabaseRunestones.getAllRunestones();
      await this.updateCache(allRunestones);
    }
    return allStones;
  }

  async getRunestonesByBounds(bounds: [number, number, number, number]): Promise<Runestone[]> {
    await this.initializeCache(); // Ensure cache is initialized

    // Check if cache is expired
    if (this.isCacheExpired()) {
      await this.clearCache();
      await this.initializeCache();
    }

    const db = await this.db;
    const key = this.boundsKey(bounds);

    // Check if we have all data cached (global bounds entry exists)
    if (this.cachedBounds.has('*')) {
      const allStones = await db.getAll('runestones');
      return this.filterByBounds(allStones, bounds);
    }

    // Check if we have overlapping cached data for this specific region
    for (const [, cachedBounds] of this.cachedBounds.entries()) {
      if (this.boundsOverlap(bounds, cachedBounds)) {
        const allStones = await db.getAll('runestones');
        return this.filterByBounds(allStones, bounds);
      }
    }
    // If no cache hit, load from Supabase
    const data = await supabaseRunestones.getVisibleRunestones(
      bounds[0], // west
      bounds[1], // south
      bounds[2], // east
      bounds[3] // north
    );
    await this.updateCache(data);
    this.cachedBounds.set(key, bounds);

    return data;
  }

  private filterByBounds(stones: Runestone[], bounds: [number, number, number, number]): Runestone[] {
    const [west, south, east, north] = bounds;
    return stones.filter(
      (stone) =>
        stone.latitude >= south && stone.latitude <= north && stone.longitude >= west && stone.longitude <= east
    );
  }

  async updateCache(runestones: Runestone[]) {
    const db = await this.db;
    const tx = db.transaction('runestones', 'readwrite');

    await Promise.all([...runestones.map((stone) => tx.store.put(stone)), tx.done]);

    this.lastUpdate = Date.now();
  }

  async clearCache() {
    const db = await this.db;
    await db.clear('runestones');
    this.lastUpdate = 0;
    this.cachedBounds.clear();
  }

  async ensureCacheInitialized() {
    await this.initializeCache();
  }

  async getRunestoneBySlug(slug: string): Promise<Runestone | null> {
    await this.initializeCache();

    const db = await this.db;
    const allStones = await db.getAll('runestones');

    // Find the runestone with matching slug
    const runestone = allStones.find((stone) => stone.slug === slug);

    return runestone || null;
  }

  async searchRunestones(query: string, limit: number = 100): Promise<Runestone[]> {
    await this.initializeCache();

    if (!query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const db = await this.db;

    // Get all runestones and filter in memory - faster than cursor for dataset of this size (<10k)
    // because it avoids thousands of IPC round-trips
    const allStones = await db.getAll('runestones');
    const results: Runestone[] = [];

    for (const runestone of allStones) {
      if (this.matchesSearchTerm(runestone, searchTerm)) {
        results.push(runestone);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  private matchesSearchTerm(runestone: Runestone, searchTerm: string): boolean {
    // Check fields directly without creating an array to avoid allocation
    if (runestone.signature_text && runestone.signature_text.toLowerCase().includes(searchTerm)) return true;
    if (runestone.found_location && runestone.found_location.toLowerCase().includes(searchTerm)) return true;
    if (runestone.parish && runestone.parish.toLowerCase().includes(searchTerm)) return true;
    if (runestone.district && runestone.district.toLowerCase().includes(searchTerm)) return true;
    if (runestone.municipality && runestone.municipality.toLowerCase().includes(searchTerm)) return true;
    if (runestone.current_location && runestone.current_location.toLowerCase().includes(searchTerm)) return true;
    if (runestone.material && runestone.material.toLowerCase().includes(searchTerm)) return true;
    if (runestone.material_type && runestone.material_type.toLowerCase().includes(searchTerm)) return true;
    if (runestone.rune_type && runestone.rune_type.toLowerCase().includes(searchTerm)) return true;
    if (runestone.dating && runestone.dating.toLowerCase().includes(searchTerm)) return true;
    if (runestone.style && runestone.style.toLowerCase().includes(searchTerm)) return true;
    if (runestone.carver && runestone.carver.toLowerCase().includes(searchTerm)) return true;
    if (runestone.english_translation && runestone.english_translation.toLowerCase().includes(searchTerm)) return true;
    if (runestone.swedish_translation && runestone.swedish_translation.toLowerCase().includes(searchTerm)) return true;
    if (runestone.norse_text && runestone.norse_text.toLowerCase().includes(searchTerm)) return true;
    if (runestone.transliteration && runestone.transliteration.toLowerCase().includes(searchTerm)) return true;

    return false;
  }
}

export const runestonesCache = new RunestonesCache();
