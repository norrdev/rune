import * as SQLite from 'expo-sqlite';
import { supabaseRunestones } from '../supabaseRunestones';
import type { Runestone, RunestoneRow } from '../../types';

const TOTAL_RUNESTONES = 6815;
const DB_NAME = 'runestones.db';
const SCHEMA_VERSION = 2; // Increment this to force table recreation

class RunestonesCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private lastUpdate: number = 0;
  private CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize database on construction
    this.initPromise = this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Check current schema version
      let currentVersion = 0;
      try {
        const result = await this.db.getFirstAsync<{ value: string }>(
          "SELECT value FROM cache_metadata WHERE key = 'schema_version'"
        );
        if (result) {
          currentVersion = parseInt(result.value, 10);
        }
      } catch (_e) {
        // Table likely doesn't exist, ignore error
      }

      // If schema version mismatch, drop tables to force recreate
      if (currentVersion < SCHEMA_VERSION) {
        console.log(`Schema version mismatch (current: ${currentVersion}, target: ${SCHEMA_VERSION}). Dropping tables...`);
        await this.db.execAsync('DROP TABLE IF EXISTS runestones');
        await this.db.execAsync('DROP TABLE IF EXISTS cache_metadata');
      }

      // Create tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS runestones (
          id INTEGER PRIMARY KEY,
          signature_text TEXT NOT NULL,
          found_location TEXT NOT NULL,
          parish TEXT NOT NULL,
          district TEXT NOT NULL,
          municipality TEXT NOT NULL,
          current_location TEXT NOT NULL,
          material TEXT NOT NULL,
          material_type TEXT,
          rune_type TEXT NOT NULL,
          dating TEXT NOT NULL,
          style TEXT NOT NULL,
          carver TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          english_translation TEXT,
          swedish_translation TEXT,
          norse_text TEXT,
          transliteration TEXT,
          lost INTEGER NOT NULL,
          ornamental INTEGER NOT NULL,
          recent INTEGER NOT NULL,
          visited INTEGER DEFAULT 0,
          slug TEXT,
          link_url TEXT,
          direct_url TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_coordinates ON runestones(latitude, longitude);
        CREATE INDEX IF NOT EXISTS idx_slug ON runestones(slug);

        CREATE TABLE IF NOT EXISTS cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Store new schema version
      if (currentVersion < SCHEMA_VERSION) {
         await this.db.runAsync(
          "INSERT OR REPLACE INTO cache_metadata (key, value) VALUES ('schema_version', ?)",
          [SCHEMA_VERSION.toString()]
        );
      }

      // Load last update timestamp
      const result = await this.db.getFirstAsync<{ value: string }>(
        'SELECT value FROM cache_metadata WHERE key = ?',
        ['last_update']
      );

      if (result) {
        this.lastUpdate = parseInt(result.value, 10);
      }

    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
    }
  }

  private async ensureInitialized() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async getRunestoneCount(): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) return 0;

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM runestones'
    );

    return result?.count || 0;
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }

  async getAllRunestones(): Promise<Runestone[]> {
    await this.initializeCache();
    await this.ensureInitialized();

    if (!this.db) return [];

    const rows = await this.db.getAllAsync<RunestoneRow>('SELECT * FROM runestones');
    return rows.map((row) => this.rowToRunestone(row));
  }

  private async initializeCache() {
    await this.ensureInitialized();

    if (!this.db) return;

    // Check if we have valid cached data
    const count = await this.getRunestoneCount();
    if (count >= TOTAL_RUNESTONES && !this.isCacheExpired()) {
      return;
    }

    try {
      console.log('Fetching all runestones from Supabase...');
      const allRunestones = await supabaseRunestones.getAllRunestones();

      console.log(`Storing ${allRunestones.length} runestones in SQLite...`);

      // Clear existing data
      await this.db.execAsync('DELETE FROM runestones');

      // Insert in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < allRunestones.length; i += batchSize) {
        const batch = allRunestones.slice(i, i + batchSize);

        await this.db.withTransactionAsync(async () => {
          for (const runestone of batch) {
            await this.insertRunestone(runestone);
          }
        });
      }

      // Update metadata
      this.lastUpdate = Date.now();
      await this.db.runAsync(
        'INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)',
        ['last_update', this.lastUpdate.toString()]
      );

      console.log('SQLite cache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite cache:', error);
    }
  }

  private async insertRunestone(runestone: Runestone) {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO runestones (
        id, signature_text, found_location, parish, district, municipality,
        current_location, material, material_type, rune_type, dating, style,
        carver, latitude, longitude, english_translation, swedish_translation,
        norse_text, transliteration, lost, ornamental, recent, visited, slug,
        link_url, direct_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runestone.id,
        runestone.signature_text,
        runestone.found_location,
        runestone.parish,
        runestone.district,
        runestone.municipality,
        runestone.current_location,
        runestone.material,
        runestone.material_type || null,
        runestone.rune_type,
        runestone.dating,
        runestone.style,
        runestone.carver,
        runestone.latitude,
        runestone.longitude,
        runestone.english_translation || null,
        runestone.swedish_translation || null,
        runestone.norse_text || null,
        runestone.transliteration || null,
        runestone.lost ? 1 : 0,
        runestone.ornamental ? 1 : 0,
        runestone.recent ? 1 : 0,
        runestone.visited ? 1 : 0,
        runestone.slug || null,
        runestone.link_url || null,
        runestone.direct_url || null,
      ]
    );
  }

  private rowToRunestone(row: RunestoneRow): Runestone {
    return {
      id: row.id,
      signature_text: row.signature_text,
      found_location: row.found_location,
      parish: row.parish,
      district: row.district,
      municipality: row.municipality,
      current_location: row.current_location,
      material: row.material,
      material_type: row.material_type ?? undefined,
      rune_type: row.rune_type,
      dating: row.dating,
      style: row.style,
      carver: row.carver,
      latitude: row.latitude,
      longitude: row.longitude,
      english_translation: row.english_translation ?? undefined,
      swedish_translation: row.swedish_translation ?? undefined,
      norse_text: row.norse_text ?? undefined,
      transliteration: row.transliteration ?? undefined,
      lost: row.lost === 1,
      ornamental: row.ornamental === 1,
      recent: row.recent === 1,
      visited: row.visited === 1,
      slug: row.slug ?? undefined,
      link_url: row.link_url ?? undefined,
      direct_url: row.direct_url ?? undefined,
    };
  }

  async getRunestonesByBounds(bounds: [number, number, number, number]): Promise<Runestone[]> {
    await this.initializeCache();
    await this.ensureInitialized();

    if (!this.db) return [];

    if (this.isCacheExpired()) {
      await this.clearCache();
      await this.initializeCache();
    }

    const [west, south, east, north] = bounds;

    const rows = await this.db.getAllAsync<RunestoneRow>(
      `SELECT * FROM runestones 
       WHERE latitude >= ? AND latitude <= ? 
       AND longitude >= ? AND longitude <= ?`,
      [south, north, west, east]
    );

    return rows.map((row) => this.rowToRunestone(row));
  }

  async updateCache(runestones: Runestone[]) {
    await this.ensureInitialized();
    if (!this.db) return;

    await this.db.withTransactionAsync(async () => {
      for (const runestone of runestones) {
        await this.insertRunestone(runestone);
      }
    });

    this.lastUpdate = Date.now();
    await this.db.runAsync(
      'INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)',
      ['last_update', this.lastUpdate.toString()]
    );
  }

  async clearCache() {
    await this.ensureInitialized();
    if (!this.db) return;

    await this.db.execAsync('DELETE FROM runestones');
    await this.db.execAsync('DELETE FROM cache_metadata');

    this.lastUpdate = 0;
  }

  async ensureCacheInitialized() {
    await this.initializeCache();
  }

  async getRunestoneBySlug(slug: string): Promise<Runestone | null> {
    await this.initializeCache();
    await this.ensureInitialized();

    if (!this.db) return null;

    const row = await this.db.getFirstAsync<RunestoneRow>(
      'SELECT * FROM runestones WHERE slug = ?',
      [slug]
    );

    return row ? this.rowToRunestone(row) : null;
  }

  async searchRunestones(query: string, limit: number = 100): Promise<Runestone[]> {
    await this.initializeCache();
    await this.ensureInitialized();

    if (!this.db || !query.trim()) return [];

    const searchTerm = `%${query.toLowerCase().trim()}%`;

    const rows = await this.db.getAllAsync<RunestoneRow>(
      `SELECT * FROM runestones 
       WHERE LOWER(signature_text) LIKE ?
       OR LOWER(found_location) LIKE ?
       OR LOWER(parish) LIKE ?
       OR LOWER(district) LIKE ?
       OR LOWER(municipality) LIKE ?
       OR LOWER(current_location) LIKE ?
       OR LOWER(material) LIKE ?
       OR LOWER(material_type) LIKE ?
       OR LOWER(rune_type) LIKE ?
       OR LOWER(dating) LIKE ?
       OR LOWER(style) LIKE ?
       OR LOWER(carver) LIKE ?
       OR LOWER(english_translation) LIKE ?
       OR LOWER(swedish_translation) LIKE ?
       OR LOWER(norse_text) LIKE ?
       OR LOWER(transliteration) LIKE ?
       LIMIT ?`,
      [
        searchTerm, searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm, searchTerm,
        limit
      ]
    );

    return rows.map((row) => this.rowToRunestone(row));
  }
}

export const runestonesCache = new RunestonesCache();
