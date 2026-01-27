import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { visitedRunestonesStore } from './visitedRunestonesStore';
import { searchStore } from './searchStore';
import type { Runestone, RunestoneGeoJSON } from '../types';
import {
  JARLABANKE_BRIDGE,
  createGeoJSONData,
  DEFAULT_ZOOM_NATIVE,
  DEFAULT_ZOOM_WEB,
  SEARCH_ZOOM_NATIVE,
  SEARCH_ZOOM_WEB,
  CAMERA_ANIMATION_DURATION_NATIVE,
  CAMERA_ANIMATION_DURATION_WEB,
} from '../components/Map/mapUtils';

type MapPlatform = 'native' | 'web';

class MapStore {
  // Data
  runestones: Runestone[] = [];
  loading: boolean = false;
  error: string | null = null;

  // UI State
  selectedRunestone: Runestone | null = null;
  isModalOpen: boolean = false;
  isLocating: boolean = false;

  // Camera/Map State
  center: [number, number] = JARLABANKE_BRIDGE;
  zoom: number = DEFAULT_ZOOM_NATIVE;
  bearing: number = 0;

  // Platform
  platform: MapPlatform = 'native';

  // Map instance (for web)
  mapInstance: MapLibreMap | null = null;

  // Camera animation trigger (for native - to trigger useEffect)
  cameraUpdateTrigger: number = 0;

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
      bearing: observable,
      platform: observable,
      mapInstance: observable,
      cameraUpdateTrigger: observable,

      // Actions
      setLoading: action,
      setError: action,
      setRunestones: action,
      setSelectedRunestone: action,
      setIsModalOpen: action,
      setIsLocating: action,
      setCenter: action,
      setZoom: action,
      setBearing: action,
      setPlatform: action,
      setMapInstance: action,
      triggerCameraUpdate: action,
      loadRunestones: action,
      refreshVisitedStatus: action,
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
      isReady: computed,
      defaultZoom: computed,
      searchZoom: computed,
      animationDuration: computed,
    });

    // React to visited status changes
    reaction(
      () => visitedRunestonesStore.visitedCount,
      () => {
        this.refreshVisitedStatus();
      },
    );

    // React to search selection
    reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone) {
          this.flyToRunestone(runestone, this.searchZoom);
          searchStore.setSelectedRunestone(null);
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

  setCenter(center: [number, number]) {
    this.center = center;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  setBearing(bearing: number) {
    this.bearing = bearing;
  }

  setPlatform(platform: MapPlatform) {
    this.platform = platform;
    // Update default zoom based on platform
    this.zoom = platform === 'native' ? DEFAULT_ZOOM_NATIVE : DEFAULT_ZOOM_WEB;
  }

  setMapInstance(map: MapLibreMap | null) {
    this.mapInstance = map;
  }

  triggerCameraUpdate() {
    this.cameraUpdateTrigger += 1;
  }

  async loadRunestones() {
    this.setLoading(true);
    this.setError(null);

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
  }

  refreshVisitedStatus() {
    // Force re-computation of geoJsonData by updating runestones reference
    this.setRunestones([...this.runestones]);
  }

  openModal(runestone: Runestone) {
    this.setSelectedRunestone(runestone);
    this.setIsModalOpen(true);
  }

  closeModal() {
    this.setIsModalOpen(false);
    this.setSelectedRunestone(null);
  }

  flyToRunestone(runestone: Runestone, zoom?: number) {
    const targetZoom = zoom ?? this.defaultZoom;
    this.flyToLocation(runestone.longitude, runestone.latitude, targetZoom);
    this.openModal(runestone);
  }

  flyToLocation(longitude: number, latitude: number, zoom?: number) {
    const targetZoom = zoom ?? this.zoom;

    if (this.platform === 'web' && this.mapInstance) {
      // Web: use MapLibre's flyTo
      this.mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: targetZoom,
        duration: this.animationDuration,
      });
    } else {
      // Native: update observables and trigger camera update
      this.setCenter([longitude, latitude]);
      this.setZoom(targetZoom);
      this.triggerCameraUpdate();
    }
  }

  resetBearing() {
    if (this.platform === 'web' && this.mapInstance) {
      // Web: use MapLibre's easeTo
      this.mapInstance.easeTo({
        bearing: 0,
        duration: this.animationDuration,
      });
    } else {
      // Native: update observable and trigger camera update
      this.setBearing(0);
      this.triggerCameraUpdate();
    }
  }

  async getCurrentLocation() {
    this.setIsLocating(true);

    try {
      if (this.platform === 'web') {
        // Web: use browser geolocation API
        await this.getCurrentLocationWeb();
      } else {
        // Native: use MapLibre location manager
        await this.getCurrentLocationNative();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      const errorMessage = 'Unable to get your current location';

      if (this.platform === 'web') {
        alert(errorMessage);
      } else {
        // Dynamically import Alert for native
        const { Alert } = await import('react-native');
        Alert.alert('Location Error', errorMessage);
      }
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

  private async getCurrentLocationNative(): Promise<void> {
    // Dynamically import React Native modules only when needed
    const { Platform, PermissionsAndroid } = await import('react-native');
    const MapLibreGL = await import('@maplibre/maplibre-react-native');

    // Request location permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to center the map on your position.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission denied');
      }
    }

    // Get user location from MapLibre
    const location = await MapLibreGL.default.locationManager.getLastKnownLocation();

    if (location) {
      this.flyToLocation(location.coords.longitude, location.coords.latitude, 15);
    } else {
      throw new Error('Location not available');
    }
  }

  // ============ Computed Values ============

  get geoJsonData(): RunestoneGeoJSON {
    return createGeoJSONData(this.runestonesWithVisitedStatus);
  }

  get runestonesWithVisitedStatus(): Runestone[] {
    return visitedRunestonesStore.applyVisitedStatus(this.runestones);
  }

  get hasRunestones(): boolean {
    return this.runestones.length > 0;
  }

  get isReady(): boolean {
    return !this.loading && !this.error && this.hasRunestones;
  }

  get defaultZoom(): number {
    return this.platform === 'native' ? DEFAULT_ZOOM_NATIVE : DEFAULT_ZOOM_WEB;
  }

  get searchZoom(): number {
    return this.platform === 'native' ? SEARCH_ZOOM_NATIVE : SEARCH_ZOOM_WEB;
  }

  get animationDuration(): number {
    return this.platform === 'native'
      ? CAMERA_ANIMATION_DURATION_NATIVE
      : CAMERA_ANIMATION_DURATION_WEB;
  }
}

// Create and export a singleton instance
export const mapStore = new MapStore();
