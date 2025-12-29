import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseRunestones } from './supabaseRunestones';
import { Runestone } from '../types';

const TOTAL_RUNESTONES = 6815;

// AsyncStorage keys
const STORAGE_KEYS = {
  RUNESTONES: 'runestones-cache',
  LAST_UPDATE: 'runestones-last-update',
  CACHED_BOUNDS: 'runestones-cached-bounds',
};

class RunestonesCache {
  private runestones: Runestone[] = [];
  private lastUpdate: number = 0;
  private CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year
  private isInitialized = false;
  private cachedBounds: Map<string, [number, number, number, number]> = new Map();

  constructor() {
    // Load cached data from AsyncStorage on initialization
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const [storedRunestones, storedLastUpdate, storedBounds] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RUNESTONES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.getItem(STORAGE_KEYS.CACHED_BOUNDS),
      ]);

      if (storedRunestones) {
        this.runestones = JSON.parse(storedRunestones);
      }

      if (storedLastUpdate) {
        this.lastUpdate = parseInt(storedLastUpdate, 10);
      }

      if (storedBounds) {
        const boundsArray = JSON.parse(storedBounds);
        this.cachedBounds = new Map(boundsArray);
      }
    } catch (error) {
      console.error('Failed to load from AsyncStorage:', error);
    }
  }

  private async saveToStorage() {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.RUNESTONES, JSON.stringify(this.runestones)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, this.lastUpdate.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.CACHED_BOUNDS, JSON.stringify(Array.from(this.cachedBounds.entries()))),
      ]);
    } catch (error) {
      console.error('Failed to save to AsyncStorage:', error);
    }
  }

  async getAllRunestones(): Promise<Runestone[]> {
    await this.initializeCache();
    return this.runestones;
  }

  private async initializeCache() {
    if (this.isInitialized) return;

    // Check if we have valid cached data
    if (this.runestones.length >= TOTAL_RUNESTONES && !this.isCacheExpired()) {
      this.isInitialized = true;
      return;
    }

    try {
      const allRunestones = await supabaseRunestones.getAllRunestones();
      this.runestones = allRunestones;
      this.lastUpdate = Date.now();
      this.cachedBounds.set('*', [-180, -90, 180, 90]);
      this.isInitialized = true;

      // Persist to MMKV
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to initialize native cache:', error);
    }
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

  async getRunestonesByBounds(bounds: [number, number, number, number]): Promise<Runestone[]> {
    await this.initializeCache();

    if (this.isCacheExpired()) {
      await this.clearCache();
      await this.initializeCache();
    }

    // In native memory mode, we just filter the full list
    return this.filterByBounds(this.runestones, bounds);
  }

  private filterByBounds(stones: Runestone[], bounds: [number, number, number, number]): Runestone[] {
    const [west, south, east, north] = bounds;
    return stones.filter(
      (stone) =>
        stone.latitude >= south && stone.latitude <= north && stone.longitude >= west && stone.longitude <= east
    );
  }

  async updateCache(runestones: Runestone[]) {
    // In full memory mode, this is handled by fetch, but we can merge if needed
    const newIds = new Set(runestones.map(r => r.id));
    this.runestones = [
      ...this.runestones.filter(r => !newIds.has(r.id)),
      ...runestones
    ];
    this.lastUpdate = Date.now();

    // Persist to MMKV
    this.saveToStorage();
  }

  async clearCache() {
    this.runestones = [];
    this.lastUpdate = 0;
    this.cachedBounds.clear();
    this.isInitialized = false;

    // Clear AsyncStorage
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.RUNESTONES),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_UPDATE),
      AsyncStorage.removeItem(STORAGE_KEYS.CACHED_BOUNDS),
    ]);
  }

  async ensureCacheInitialized() {
    await this.initializeCache();
  }

  async getRunestoneBySlug(slug: string): Promise<Runestone | null> {
    await this.initializeCache();
    return this.runestones.find((stone) => stone.slug === slug) || null;
  }

  async searchRunestones(query: string, limit: number = 100): Promise<Runestone[]> {
    await this.initializeCache();

    if (!query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results: Runestone[] = [];

    for (const runestone of this.runestones) {
      if (results.length >= limit) break;
      if (this.matchesSearchTerm(runestone, searchTerm)) {
        results.push(runestone);
      }
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

    return searchableFields.some((field) => field && field.toLowerCase().includes(searchTerm));
  }
}

export const runestonesCache = new RunestonesCache();
