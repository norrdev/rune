import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { visitedRunestonesStore } from './visitedRunestonesStore';
import { searchStore } from './searchStore';
import type { Runestone, RunestoneGeoJSON } from '../types';
import {
  JARLABANKE_BRIDGE,
  createGeoJSONData,
  DEFAULT_ZOOM,
  SEARCH_ZOOM,
  CAMERA_ANIMATION_DURATION,
} from '../components/Map/mapUtils';

class MapStore {
  // Data
  runestones: Runestone[] = [];
  loading: boolean = false;
  error: string | null = null;

  // UI State
  selectedRunestone: Runestone | null = null;
  isModalOpen: boolean = false;
  isLocating: boolean = false;

  // Camera to use when the map is (re)created
  center: [number, number] = JARLABANKE_BRIDGE;
  zoom: number = DEFAULT_ZOOM;

  // Must use ref to prevent MobX Proxy wrapping MapLibre internals
  mapInstance: MapLibreMap | null = null;

  // User Location
  userLocation: [number, number] | null = null;
  private locationWatchId: number | null = null;
  private loadPromise: Promise<void> | null = null;
  locationError: string | null = null;

  constructor() {
    makeObservable(this, {
      // Observables
      runestones: observable,
      loading: observable,
      error: observable,
      selectedRunestone: observable,
      isModalOpen: observable,
      isLocating: observable,
      center: observable,
      zoom: observable,
      mapInstance: observable.ref,
      userLocation: observable,
      locationError: observable,

      // Actions
      setLoading: action,
      setError: action,
      setRunestones: action,
      setSelectedRunestone: action,
      setIsModalOpen: action,
      setIsLocating: action,
      setLocationError: action,
      setCenter: action,
      setZoom: action,
      setMapInstance: action,
      loadRunestones: action,
      openModal: action,
      closeModal: action,
      flyToRunestone: action,
      flyToLocation: action,
      resetBearing: action,
      getCurrentLocation: action,

      // Computed
      geoJsonData: computed,
      runestonesWithVisitedStatus: computed,
      hasRunestones: computed,
    });

    // React to search selection
    reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone) {
          this.flyToRunestone(runestone, SEARCH_ZOOM);
          // Defer cross-store mutation out of the reaction to avoid
          // mutating an observed value inside its own reaction.
          setTimeout(() => searchStore.setSelectedRunestone(null), 0);
        }
      },
    );
  }

  // ============ Actions ============

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setRunestones(runestones: Runestone[]) {
    this.runestones = runestones;
  }

  setSelectedRunestone(runestone: Runestone | null) {
    this.selectedRunestone = runestone;
  }

  setIsModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  setIsLocating(isLocating: boolean) {
    this.isLocating = isLocating;
  }

  setLocationError(message: string | null) {
    this.locationError = message;
  }

  setCenter(center: [number, number]) {
    this.center = center;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  setMapInstance(map: MapLibreMap | null) {
    this.mapInstance = map;
    if (map === null && this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
      this.userLocation = null;
    }
  }

  async loadRunestones() {
    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }
    this.setLoading(true);
    this.setError(null);

    this.loadPromise = (async () => {
      try {
        const data = await runestonesCache.getAllRunestones();
        runInAction(() => {
          this.setRunestones(data);
        });
      } catch (error) {
        console.error('Failed to load runestones:', error);
        runInAction(() => {
          this.setError('Failed to load runestones');
        });
      } finally {
        runInAction(() => {
          this.setLoading(false);
        });
      }
    })();

    try {
      await this.loadPromise;
    } finally {
      runInAction(() => {
        this.loadPromise = null;
      });
    }
  }

  openModal(runestone: Runestone) {
    this.setSelectedRunestone(runestone);
    this.setIsModalOpen(true);
  }

  closeModal() {
    this.setIsModalOpen(false);
    this.setSelectedRunestone(null);
  }

  flyToRunestone(runestone: Runestone, zoom = DEFAULT_ZOOM) {
    this.flyToLocation(runestone.longitude, runestone.latitude, zoom);
    this.openModal(runestone);
  }

  // Without a map yet, the stored camera is used when the map is created.
  flyToLocation(longitude: number, latitude: number, zoom = this.zoom) {
    this.setCenter([longitude, latitude]);
    this.setZoom(zoom);
    this.mapInstance?.flyTo({
      center: [longitude, latitude],
      zoom,
      duration: CAMERA_ANIMATION_DURATION,
    });
  }

  resetBearing() {
    this.mapInstance?.easeTo({ bearing: 0, duration: CAMERA_ANIMATION_DURATION });
  }

  async getCurrentLocation() {
    this.setIsLocating(true);
    this.setLocationError(null);

    try {
      if (this.locationWatchId === null && 'geolocation' in navigator) {
        this.locationWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            runInAction(() => {
              this.userLocation = [longitude, latitude];
            });
          },
          (error) => {
            console.error('WatchPosition error:', error);
            // Stop a failing watcher instead of leaking it forever.
            if (this.locationWatchId !== null) {
              navigator.geolocation.clearWatch(this.locationWatchId);
              this.locationWatchId = null;
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
          },
        );
      }
      await this.getCurrentLocationWeb();
    } catch (error) {
      console.error('Error getting location:', error);
      if (this.locationWatchId !== null) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
      }
      runInAction(() => {
        this.setLocationError(
          error instanceof Error ? error.message : 'Unable to get your current location',
        );
      });
    } finally {
      runInAction(() => {
        this.setIsLocating(false);
      });
    }
  }

  private async getCurrentLocationWeb(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          runInAction(() => {
            this.userLocation = [longitude, latitude];
          });
          this.flyToLocation(longitude, latitude, 15);
          resolve();
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  }

  // ============ Computed Values ============

  get geoJsonData(): RunestoneGeoJSON {
    return createGeoJSONData(this.runestonesWithVisitedStatus);
  }

  // Tracks visitedRunestonesStore.visitedRunestoneIds, so geoJsonData recomputes on its own
  // whenever visited status changes.
  get runestonesWithVisitedStatus(): Runestone[] {
    return visitedRunestonesStore.applyVisitedStatus(this.runestones);
  }

  get hasRunestones(): boolean {
    return this.runestones.length > 0;
  }

}

// Create and export a singleton instance
export const mapStore = new MapStore();
