import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx';
import { supabaseRunestones } from '../services/supabaseRunestones';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { authStore } from './authStore';
import type { Runestone } from '../types';

// Matches the row count of get_all_runestones.
const TOTAL_RUNESTONES = 6815;

class VisitedRunestonesStore {
  visitedRunestoneIds: Set<number> = new Set();
  visitedRunestoneDetails: Runestone[] = [];
  updatingRunestoneIds: Set<number> = new Set();
  detailsLoading: boolean = false;
  detailsError: string | null = null;
  loading: boolean = false;
  error: string | null = null;
  readonly totalRunestonesCount = TOTAL_RUNESTONES;
  private fetchToken = 0;

  constructor() {
    makeObservable(this, {
      visitedRunestoneIds: observable,
      visitedRunestoneDetails: observable,
      updatingRunestoneIds: observable,
      detailsLoading: observable,
      detailsError: observable,
      loading: observable,
      error: observable,
      setLoading: action,
      setError: action,
      setDetailsLoading: action,
      setDetailsError: action,
      setVisitedRunestoneDetails: action,
      setVisitedRunestoneIds: action,
      addVisitedRunestone: action,
      removeVisitedRunestone: action,
      clearVisitedRunestones: action,
      fetchVisitedRunestones: action,
      fetchVisitedRunestoneDetails: action,
      markAsVisited: action,
      unmarkAsVisited: action,
      isRunestoneVisited: computed,
      isRunestoneUpdating: computed,
      visitedCount: computed,
      completionPercentage: computed,
      applyVisitedStatus: computed,
    });

    // React to auth changes - fetch visited runestones when user logs in and email is confirmed, clear when logs out
    // No fireImmediately: authStore.initializeAuth() resolves async after construction.
    // With fireImmediately we'd clear on startup (false) and never refetch (false->false).
    reaction(
      () => authStore.isFullyAuthenticated,
      (isFullyAuthenticated) => {
        if (isFullyAuthenticated) {
          this.fetchVisitedRunestones();
        } else {
          this.clearVisitedRunestones();
        }
      },
    );

    // React to changes in visitedRunestoneIds to update details automatically
    reaction(
      () =>
        Array.from(this.visitedRunestoneIds)
          .sort((a, b) => a - b)
          .join(','),
      async () => {
        await this.fetchVisitedRunestoneDetails();
      },
      { fireImmediately: true },
    );
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setDetailsLoading(loading: boolean) {
    this.detailsLoading = loading;
  }

  setDetailsError(error: string | null) {
    this.detailsError = error;
  }

  setVisitedRunestoneDetails(details: Runestone[]) {
    this.visitedRunestoneDetails = details;
  }

  setVisitedRunestoneIds(ids: Set<number>) {
    this.visitedRunestoneIds = ids;
  }

  addVisitedRunestone(id: number) {
    this.visitedRunestoneIds.add(id);
  }

  removeVisitedRunestone(id: number) {
    this.visitedRunestoneIds.delete(id);
  }

  clearVisitedRunestones() {
    this.fetchToken += 1; // a fetch still in flight belongs to the previous user
    this.loading = false;
    this.visitedRunestoneIds.clear();
    this.updatingRunestoneIds.clear();
    this.visitedRunestoneDetails = [];
    this.detailsError = null;
    this.error = null;
  }

  async fetchVisitedRunestoneDetails() {
    if (this.visitedRunestoneIds.size === 0) {
      runInAction(() => {
        this.setVisitedRunestoneDetails([]);
        this.setDetailsError(null);
        this.setDetailsLoading(false);
      });
      return;
    }

    runInAction(() => {
      this.setDetailsLoading(true);
      this.setDetailsError(null);
    });

    try {
      const details = await this.getVisitedRunestoneDetails();
      runInAction(() => {
        this.setVisitedRunestoneDetails(details);
      });
    } catch (err) {
      console.error('Error fetching visited runestone details:', err);
      runInAction(() => {
        this.setDetailsError('Failed to load runestone details. Please try again.');
      });
    } finally {
      runInAction(() => {
        this.setDetailsLoading(false);
      });
    }
  }

  async fetchVisitedRunestones() {
    if (!authStore.isFullyAuthenticated) {
      this.clearVisitedRunestones();
      return;
    }

    const myToken = ++this.fetchToken;
    this.setLoading(true);
    this.setError(null);

    try {
      const visitedData = await supabaseRunestones.getAllVisitedRunestones();
      if (myToken !== this.fetchToken) return;
      runInAction(() => {
        this.setVisitedRunestoneIds(new Set(visitedData.map((rs) => rs.id)));
      });
    } catch (error) {
      if (myToken !== this.fetchToken) return;
      console.error('Error fetching visited runestones:', error);
      runInAction(() => {
        this.setError('Failed to fetch visited runestones');
      });
    } finally {
      if (myToken === this.fetchToken) {
        runInAction(() => {
          this.setLoading(false);
        });
      }
    }
  }

  // Mark/unmark failures are reported through the return value: callers show their own
  // inline error. `error` is reserved for fetch failures (the profile shows it full-page).
  // Any reply without an error counts as success: older database functions return false
  // when the stone was already in the requested state (e.g. changed on another device).
  async markAsVisited(runestoneId: number): Promise<boolean> {
    if (!authStore.isFullyAuthenticated) {
      console.warn('markAsVisited: User not fully authenticated');
      return false;
    }
    if (this.updatingRunestoneIds.has(runestoneId)) return false;

    runInAction(() => {
      this.updatingRunestoneIds.add(runestoneId);
    });

    try {
      await supabaseRunestones.markAsVisited(runestoneId);
      runInAction(() => {
        this.addVisitedRunestone(runestoneId);
      });
      return true;
    } catch (error) {
      console.error('Error marking runestone as visited:', error);
      return false;
    } finally {
      runInAction(() => {
        this.updatingRunestoneIds.delete(runestoneId);
      });
    }
  }

  async unmarkAsVisited(runestoneId: number): Promise<boolean> {
    if (!authStore.isFullyAuthenticated) {
      console.warn('unmarkAsVisited: User not fully authenticated');
      return false;
    }
    if (this.updatingRunestoneIds.has(runestoneId)) return false;

    runInAction(() => {
      this.updatingRunestoneIds.add(runestoneId);
    });

    try {
      await supabaseRunestones.deleteVisited(runestoneId);
      runInAction(() => {
        this.removeVisitedRunestone(runestoneId);
      });
      return true;
    } catch (error) {
      console.error('Error unmarking runestone as visited:', error);
      return false;
    } finally {
      runInAction(() => {
        this.updatingRunestoneIds.delete(runestoneId);
      });
    }
  }

  get isRunestoneVisited() {
    return (runestoneId: number): boolean => {
      return this.visitedRunestoneIds.has(runestoneId);
    };
  }

  get isRunestoneUpdating() {
    return (runestoneId: number): boolean => {
      return this.updatingRunestoneIds.has(runestoneId);
    };
  }

  get visitedCount(): number {
    return this.visitedRunestoneIds.size;
  }

  get completionPercentage(): number {
    // One decimal: with ~6800 stones, whole percents read 0% until 34 visits.
    return Math.round((this.visitedCount / this.totalRunestonesCount) * 1000) / 10;
  }

  // Method to get visited runestone details from cache
  async getVisitedRunestoneDetails(): Promise<Runestone[]> {
    if (this.visitedRunestoneIds.size === 0) {
      return [];
    }

    try {
      const allRunestones = await runestonesCache.getAllRunestones();
      return allRunestones.filter((runestone) => this.visitedRunestoneIds.has(runestone.id));
    } catch (error) {
      console.error('Error getting visited runestone details from cache:', error);
      throw error;
    }
  }

  // Helper method to apply visited status to runestones array
  get applyVisitedStatus() {
    return (runestones: Runestone[]): Runestone[] => {
      return runestones.map((runestone) => ({
        ...runestone,
        visited: this.isRunestoneVisited(runestone.id),
      }));
    };
  }
}

// Create and export a singleton instance
export const visitedRunestonesStore = new VisitedRunestonesStore();
