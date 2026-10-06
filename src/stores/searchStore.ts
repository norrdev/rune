import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import type { Runestone } from '../types';
import { runestonesCache } from '../services/Cache/runestonesCache';

class SearchStore {
  searchQuery: string = '';
  searchResults: Runestone[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;
  selectedRunestone: Runestone | null = null;
  private searchToken = 0;

  constructor() {
    makeObservable(this, {
      searchQuery: observable,
      searchResults: observable,
      isLoading: observable,
      hasSearched: observable,
      selectedRunestone: observable,
      setSearchQuery: action,
      setSearchResults: action,
      setLoading: action,
      setHasSearched: action,
      setSelectedRunestone: action,
      performSearch: action,
      clearSearch: action,
      hasResults: computed,
      resultCount: computed,
      isEmptySearch: computed,
    });
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  setSearchResults(results: Runestone[]) {
    this.searchResults = results;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setHasSearched(searched: boolean) {
    this.hasSearched = searched;
  }

  setSelectedRunestone(runestone: Runestone | null) {
    this.selectedRunestone = runestone;
  }

  async performSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      this.searchToken += 1;
      runInAction(() => {
        this.setSearchQuery('');
        this.setSearchResults([]);
        this.setHasSearched(false);
        this.setLoading(false);
      });
      return;
    }

    const myToken = ++this.searchToken;
    runInAction(() => {
      this.setSearchQuery(query);
      this.setLoading(true);
      this.setHasSearched(true);
    });

    try {
      // Use the efficient search function from runestonesCache
      const results = await runestonesCache.searchRunestones(query, 100);

      // Stale response: a newer search started since.
      if (myToken !== this.searchToken) return;
      runInAction(() => {
        this.setSearchResults(results);
        this.setLoading(false);
      });
    } catch (error) {
      if (myToken !== this.searchToken) return;
      console.error('Error performing search:', error);
      runInAction(() => {
        this.setSearchResults([]);
        this.setLoading(false);
      });
    }
  }

  clearSearch() {
    this.setSearchQuery('');
    this.setSearchResults([]);
    this.setHasSearched(false);
    this.setSelectedRunestone(null);
  }

  get hasResults() {
    return this.searchResults.length > 0;
  }

  get resultCount() {
    return this.searchResults.length;
  }

  get isEmptySearch() {
    return this.hasSearched && !this.isLoading && this.searchResults.length === 0;
  }
}

// Create and export a singleton instance
export const searchStore = new SearchStore();
