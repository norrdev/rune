import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchStore } from './searchStore';
import { runestonesCache } from '../services/Cache/runestonesCache';
import type { Runestone } from '../types';

describe('searchStore', () => {
  const mockResults: Runestone[] = [
    {
      id: 1,
      signature_text: 'U 160',
      found_location: 'Risbyle',
      parish: 'Täby',
      district: '',
      municipality: '',
      current_location: '',
      material: '',
      rune_type: '',
      dating: '',
      style: '',
      carver: '',
      latitude: 59.4,
      longitude: 18.0,
      lost: false,
      ornamental: false,
      recent: false,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    searchStore.clearSearch();
  });

  it('initial state is empty', () => {
    expect(searchStore.searchQuery).toBe('');
    expect(searchStore.searchResults).toEqual([]);
    expect(searchStore.isLoading).toBe(false);
    expect(searchStore.hasSearched).toBe(false);
    expect(searchStore.hasResults).toBe(false);
    expect(searchStore.resultCount).toBe(0);
    expect(searchStore.isEmptySearch).toBe(false);
  });

  it('performs search and updates results', async () => {
    vi.spyOn(runestonesCache, 'searchRunestones').mockResolvedValueOnce(mockResults);

    await searchStore.performSearch('Risbyle');

    expect(searchStore.searchQuery).toBe('Risbyle');
    expect(searchStore.searchResults).toEqual(mockResults);
    expect(searchStore.isLoading).toBe(false);
    expect(searchStore.hasSearched).toBe(true);
    expect(searchStore.hasResults).toBe(true);
    expect(searchStore.resultCount).toBe(1);
    expect(searchStore.isEmptySearch).toBe(false);
  });

  it('handles empty query by resetting search results', async () => {
    await searchStore.performSearch('   ');

    expect(searchStore.searchQuery).toBe('');
    expect(searchStore.searchResults).toEqual([]);
    expect(searchStore.hasSearched).toBe(false);
  });

  it('computes isEmptySearch when no results match', async () => {
    vi.spyOn(runestonesCache, 'searchRunestones').mockResolvedValueOnce([]);

    await searchStore.performSearch('nonexistent');
    expect(searchStore.hasSearched).toBe(true);
    expect(searchStore.isLoading).toBe(false);
    expect(searchStore.searchResults).toHaveLength(0);
    expect(searchStore.isEmptySearch).toBe(true);
  });

  it('handles search errors gracefully', async () => {
    vi.spyOn(runestonesCache, 'searchRunestones').mockRejectedValueOnce(new Error('Search failed'));

    await searchStore.performSearch('error');
    expect(searchStore.searchResults).toEqual([]);
    expect(searchStore.isLoading).toBe(false);
  });

  it('sets and clears selected runestone', () => {
    searchStore.setSelectedRunestone(mockResults[0]);
    expect(searchStore.selectedRunestone).toEqual(mockResults[0]);

    searchStore.clearSearch();
    expect(searchStore.selectedRunestone).toBeNull();
    expect(searchStore.searchQuery).toBe('');
  });
});

