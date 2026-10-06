import { makeObservable, observable, action, runInAction } from 'mobx';
import { runestonesCache } from '../services/Cache/runestonesCache';
import type { Runestone } from '../types';

class RunestoneDetailStore {
  runestone: Runestone | null = null;
  loading: boolean = true;
  error: string | null = null;
  currentSlug: string | null = null;

  constructor() {
    makeObservable(this, {
      runestone: observable,
      loading: observable,
      error: observable,
      currentSlug: observable,
      loadRunestoneBySlug: action,
      clear: action,
    });
  }

  private requestId = 0;

  clear() {
    this.requestId += 1;
    this.runestone = null;
    this.loading = true;
    this.error = null;
    this.currentSlug = null;
  }

  async loadRunestoneBySlug(slug: string | undefined) {
    if (!slug) {
      runInAction(() => {
        this.error = 'No slug provided';
        this.loading = false;
        this.runestone = null;
        this.currentSlug = null;
      });
      return;
    }

    if (this.currentSlug === slug) {
      // Same slug and not in error state: nothing to do.
      // If previous load failed (error set, runestone null), allow retry.
      if (!this.error) return;
    }

    const myRequest = ++this.requestId;
    runInAction(() => {
      this.currentSlug = slug;
      this.loading = true;
      this.error = null;
      this.runestone = null;
    });

    try {
      const data = await runestonesCache.getRunestoneBySlug(slug);
      // Stale response from a previous navigation: ignore.
      if (myRequest !== this.requestId || this.currentSlug !== slug) return;
      runInAction(() => {
        this.runestone = data;
        if (!data) {
          this.error = 'Runestone not found';
        }
        this.loading = false;
      });
    } catch (err) {
      if (myRequest !== this.requestId || this.currentSlug !== slug) return;
      console.error('Error fetching runestone:', err);
      runInAction(() => {
        this.error = 'Failed to load runestone';
        this.loading = false;
      });
    }
  }
}

export const runestoneDetailStore = new RunestoneDetailStore();
