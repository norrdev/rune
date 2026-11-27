import { openDB, type DBSchema, type IDBPDatabase } from 'idb/build/index.js';
import { version as APP_VERSION } from '../../../package.json';
import { supabaseRunestones } from '../supabaseRunestones';
import type { Runestone } from '../../types';

const VERSION_KEY = 'runestones-cache-version';

interface RunestonesDB extends DBSchema {
  runestones: {
    key: number;
    value: Runestone;
    indexes: { 'by-slug': string };
  };
}

const readVersion = (): string | null => {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
};

const writeVersion = (version: string) => {
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch {
    // no storage: we just refetch next start
  }
};

export class RunestonesCache {
  private db: Promise<IDBPDatabase<RunestonesDB>> = openDB<RunestonesDB>('runestones-cache', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 2 && db.objectStoreNames.contains('runestones')) {
        db.deleteObjectStore('runestones');
      }
      if (!db.objectStoreNames.contains('runestones')) {
        db.createObjectStore('runestones', { keyPath: 'id' }).createIndex('by-slug', 'slug');
      }
    },
  });
  private loadPromise: Promise<void> | null = null;

  private ensureLoaded(): Promise<void> {
    this.loadPromise ??= this.load().catch((error) => {
      this.loadPromise = null; // allow retry on next call
      console.error('Failed to load runestones into cache:', error);
      throw error;
    });
    return this.loadPromise;
  }

  // shortcut: the cache refreshes once per app release, so database-only data fixes
  // reach cached users with the next release. Add a server data version if that is too slow.
  private async load() {
    const db = await this.db;
    if (readVersion() === APP_VERSION && (await db.count('runestones')) > 0) return;

    const stones = await supabaseRunestones.getAllRunestones();
    // Replace in one transaction so removed stones go away and a failure leaves the old data.
    const tx = db.transaction('runestones', 'readwrite');
    await Promise.all([tx.store.clear(), ...stones.map((stone) => tx.store.put(stone)), tx.done]);
    writeVersion(APP_VERSION);
  }

  async getAllRunestones(): Promise<Runestone[]> {
    await this.ensureLoaded();
    return (await this.db).getAll('runestones');
  }

  async getRunestoneBySlug(slug: string): Promise<Runestone | null> {
    await this.ensureLoaded();
    return (await (await this.db).getFromIndex('runestones', 'by-slug', slug)) ?? null;
  }

  async searchRunestones(query: string, limit = 100): Promise<Runestone[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];
    await this.ensureLoaded();

    const results: Runestone[] = [];
    const tx = (await this.db).transaction('runestones', 'readonly');
    let cursor = await tx.store.openCursor();
    while (cursor && results.length < limit) {
      if (matchesSearchTerm(cursor.value, searchTerm)) results.push(cursor.value);
      cursor = await cursor.continue();
    }
    return results;
  }
}

const matchesSearchTerm = (stone: Runestone, searchTerm: string): boolean =>
  [
    stone.signature_text,
    stone.found_location,
    stone.parish,
    stone.district,
    stone.municipality,
    stone.current_location,
    stone.material,
    stone.material_type,
    stone.rune_type,
    stone.dating,
    stone.style,
    stone.carver,
    stone.english_translation,
    stone.swedish_translation,
    stone.norse_text,
    stone.transliteration,
  ].some((field) => field?.toLowerCase().includes(searchTerm));

export const runestonesCache = new RunestonesCache();
