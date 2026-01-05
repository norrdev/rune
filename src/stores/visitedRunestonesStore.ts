import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx';
import { supabaseRunestones } from '../services/supabaseRunestones';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { authStore } from './authStore';
import type { Runestone } from '../types';

const TOTAL_RUNESTONES = 6815;

class VisitedRunestonesStore {
  visitedRunestoneIds: Set<number> = new Set();
  loading: boolean = false;
  error: string | null = null;
  totalRunestonesCount: number = TOTAL_RUNESTONES;

  constructor() {
    makeObservable(this, {
      visitedRunestoneIds: observable,
      loading: observable,
      error: observable,
      totalRunestonesCount: observable,
      setLoading: action,
      setError: action,
      setVisitedRunestoneIds: action,
      setTotalRunestonesCount: action,
      addVisitedRunestone: action,
      removeVisitedRunestone: action,
      clearVisitedRunestones: action,
      fetchVisitedRunestones: action,
      markAsVisited: action,
      unmarkAsVisited: action,
      isRunestoneVisited: computed,
      visitedCount: computed,
      completionPercentage: computed,
      isAuthenticated: computed,
      applyVisitedStatus: computed,
    });

    // React to auth changes - fetch visited runestones when user logs in and email is confirmed, clear when logs out
    reaction(
      () => authStore.isFullyAuthenticated,
      (isFullyAuthenticated) => {
        if (isFullyAuthenticated) {
          this.fetchVisitedRunestones();
        } else {
          this.clearVisitedRunestones();
        }
      },
      { fireImmediately: true }
    );
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setVisitedRunestoneIds(ids: Set<number>) {
    this.visitedRunestoneIds = ids;
  }

  setTotalRunestonesCount(count: number) {
    this.totalRunestonesCount = count;
  }

  addVisitedRunestone(id: number) {
    this.visitedRunestoneIds.add(id);
  }

  removeVisitedRunestone(id: number) {
    this.visitedRunestoneIds.delete(id);
  }

  clearVisitedRunestones() {
    this.visitedRunestoneIds.clear();
    this.error = null;
  }

  async fetchVisitedRunestones() {
    if (!authStore.isFullyAuthenticated) {
      this.clearVisitedRunestones();
      return;
    }

    this.setLoading(true);
    this.setError(null);

    try {
      // Fetch visited runestone IDs from Supabase
      const visitedData = await supabaseRunestones.getAllVisitedRunestones();
      const visitedIds = new Set(visitedData.map((rs: any) => rs.id));

      runInAction(() => {
        this.setVisitedRunestoneIds(visitedIds);
      });
    } catch (error) {
      console.error('Error fetching visited runestones:', error);
      runInAction(() => {
        this.setError('Failed to fetch visited runestones');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async markAsVisited(runestoneId: number): Promise<boolean> {
    if (!authStore.isFullyAuthenticated) {
      console.warn('markAsVisited: User not fully authenticated');
      return false;
    }

    try {
      const success = await supabaseRunestones.markAsVisited(runestoneId);
      if (success) {
        runInAction(() => {
          this.addVisitedRunestone(runestoneId);
        });
      }
      return success;
    } catch (error) {
      console.error('Error marking runestone as visited:', error);
      runInAction(() => {
        this.setError('Failed to mark runestone as visited');
      });
      return false;
    }
  }

  async unmarkAsVisited(runestoneId: number): Promise<boolean> {
    if (!authStore.isFullyAuthenticated) {
      console.warn('unmarkAsVisited: User not fully authenticated');
      return false;
    }

    try {
      const success = await supabaseRunestones.deleteVisited(runestoneId);
      if (success) {
        runInAction(() => {
          this.removeVisitedRunestone(runestoneId);
        });
      }
      return success;
    } catch (error) {
      console.error('Error unmarking runestone as visited:', error);
      runInAction(() => {
        this.setError('Failed to unmark runestone as visited');
      });
      return false;
    }
  }

  isVisited(runestoneId: number): boolean {
    return this.visitedRunestoneIds.has(runestoneId);
  }

  get isRunestoneVisited() {
    return (runestoneId: number): boolean => {
      return this.visitedRunestoneIds.has(runestoneId);
    };
  }

  get visitedCount(): number {
    return this.visitedRunestoneIds.size;
  }

  get completionPercentage(): number {
    return this.totalRunestonesCount > 0 ? Math.round((this.visitedCount / this.totalRunestonesCount) * 100) : 0;
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

  get isAuthenticated(): boolean {
    return authStore.isFullyAuthenticated;
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
