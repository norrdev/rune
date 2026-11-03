import { openDB, type DBSchema, type IDBPDatabase } from 'idb/build/index.js';
import { supabaseRunestones } from '../supabaseRunestones';
import type { Runestone } from '../../types';

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
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB<RunestonesDB>('runestones-cache', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          try {
            db.deleteObjectStore('runestones');
          } catch {
            // store did not exist
          }
        }
        if (!db.objectStoreNames.contains('runestones')) {
          const store = db.createObjectStore('runestones', { keyPath: 'id' });
          store.createIndex('by-coordinates', ['latitude', 'longitude']);
          store.createIndex('by-slug', 'slug');
        }
      },
    });
  }

  private async initializeCache() {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      const db = await this.db;

      // Check if we already have data in the cache
      const existingData = await db.count('runestones');

      if (existingData < TOTAL_RUNESTONES) {
        const allRunestones = await supabaseRunestones.getAllRunestones();
        await this.updateCache(allRunestones);
      }

      this.isInitialized = true;
    })();

    try {
      await this.initPromise;
    } catch (error) {
      // Allow retry on next call
      this.initPromise = null;
      console.error('Failed to initialize cache with all runestones:', error);
      throw error;
    }
  }

  async getAllRunestones(): Promise<Runestone[]> {
    await this.initializeCache();

    const db = await this.db;
    const allStones = await db.getAll('runestones');
    if (allStones.length < TOTAL_RUNESTONES) {
      const allRunestones = await supabaseRunestones.getAllRunestones();
      await this.updateCache(allRunestones);
      return allRunestones;
    }
    return allStones;
  }

  async updateCache(runestones: Runestone[]) {
    const db = await this.db;
    const tx = db.transaction('runestones', 'readwrite');

    await Promise.all(runestones.map((stone) => tx.store.put(stone)));
    await tx.done;
  }

  async clearCache() {
    const db = await this.db;
    await db.clear('runestones');
    this.isInitialized = false;
    this.initPromise = null;
  }

  async getRunestoneBySlug(slug: string): Promise<Runestone | null> {
    await this.initializeCache();

    const db = await this.db;
    try {
      const bySlug = await db.getFromIndex('runestones', 'by-slug', slug);
      if (bySlug) return bySlug;
    } catch {
      // index may not exist in old DBs: fall back to scan
    }
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

    // Use cursor to iterate through records efficiently
    const results: Runestone[] = [];
    const tx = db.transaction('runestones', 'readonly');
    const store = tx.objectStore('runestones');
    let cursor = await store.openCursor();

    while (cursor && results.length < limit) {
      const runestone = cursor.value;

      // Check if any searchable field contains the search term
      if (this.matchesSearchTerm(runestone, searchTerm)) {
        results.push(runestone);
      }

      // Continue to next record
      cursor = await cursor.continue();
    }

    return results;
  }

  private matchesSearchTerm(runestone: Runestone, searchTerm: string): boolean {
    const searchableFields = [
      runestone.signature_text,
      runestone.found_location,
      runestone.parish,
      runestone.district,
      runestone.municipality,
      runestone.current_location,
      runestone.material,
      runestone.material_type,
      runestone.rune_type,
      runestone.dating,
      runestone.style,
      runestone.carver,
      runestone.english_translation,
      runestone.swedish_translation,
      runestone.norse_text,
      runestone.transliteration,
    ];

    return searchableFields.some((field) => field?.toLowerCase().includes(searchTerm));
  }
}

export const runestonesCache = new RunestonesCache();
