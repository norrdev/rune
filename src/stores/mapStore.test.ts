import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapStore } from './mapStore';
import { runestonesCache } from '../services/Cache/runestonesCache';
import type { Runestone } from '../types';

describe('mapStore', () => {
  const sampleStone: Runestone = {
    id: 1,
    signature_text: 'U 1',
    found_location: 'Loc',
    parish: 'Par',
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
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mapStore.setRunestones([]);
    mapStore.setLoading(false);
    mapStore.setError(null);
    mapStore.closeModal();
    mapStore.setPlatform('web');
  });

  it('manages modal open and close actions', () => {
    expect(mapStore.isModalOpen).toBe(false);
    expect(mapStore.selectedRunestone).toBeNull();

    mapStore.openModal(sampleStone);
    expect(mapStore.isModalOpen).toBe(true);
    expect(mapStore.selectedRunestone).toEqual(sampleStone);

    mapStore.closeModal();
    expect(mapStore.isModalOpen).toBe(false);
    expect(mapStore.selectedRunestone).toBeNull();
  });

  it('computes platform zoom and animation durations', () => {
    mapStore.setPlatform('native');
    expect(mapStore.platform).toBe('native');
    expect(mapStore.defaultZoom).toBe(10);
    expect(mapStore.searchZoom).toBe(14);
    expect(mapStore.animationDuration).toBe(1000);

    mapStore.setPlatform('web');
    expect(mapStore.platform).toBe('web');
    expect(mapStore.defaultZoom).toBe(13);
    expect(mapStore.searchZoom).toBe(16);
    expect(mapStore.animationDuration).toBe(2000);
  });

  it('loads runestones from cache successfully', async () => {
    vi.spyOn(runestonesCache, 'getAllRunestones').mockResolvedValueOnce([sampleStone]);

    await mapStore.loadRunestones();
    expect(mapStore.runestones).toEqual([sampleStone]);
    expect(mapStore.hasRunestones).toBe(true);
    expect(mapStore.isReady).toBe(true);
    expect(mapStore.loading).toBe(false);
    expect(mapStore.error).toBeNull();
  });

  it('handles load error', async () => {
    vi.spyOn(runestonesCache, 'getAllRunestones').mockRejectedValueOnce(new Error('Load fail'));

    await mapStore.loadRunestones();
    expect(mapStore.error).toBe('Failed to load runestones');
    expect(mapStore.loading).toBe(false);
    expect(mapStore.isReady).toBe(false);
  });

  it('flies to runestone and opens modal', () => {
    const flySpy = vi.spyOn(mapStore, 'flyToLocation');
    mapStore.flyToRunestone(sampleStone);

    expect(flySpy).toHaveBeenCalledWith(18.0, 59.4, mapStore.defaultZoom);
    expect(mapStore.isModalOpen).toBe(true);
    expect(mapStore.selectedRunestone).toEqual(sampleStone);
  });

  it('resets bearing', () => {
    mapStore.setPlatform('native');
    mapStore.setBearing(45);
    mapStore.resetBearing();
    expect(mapStore.bearing).toBe(0);
  });

  it('handles geolocation lookup', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 59.3, longitude: 18.1 },
        });
      }),
      watchPosition: vi.fn().mockReturnValue(123),
      clearWatch: vi.fn(),
    };
    (navigator as any).geolocation = mockGeolocation;

    await mapStore.getCurrentLocation();
    expect(mapStore.userLocation).toEqual([18.1, 59.3]);
    expect(mapStore.isLocating).toBe(false);
  });

  it('handles geolocation error', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error(new Error('Permission denied'));
      }),
      watchPosition: vi.fn().mockReturnValue(123),
      clearWatch: vi.fn(),
    };
    (navigator as any).geolocation = mockGeolocation;

    await mapStore.getCurrentLocation();
    expect(mapStore.locationError).toBe('Permission denied');
    expect(mapStore.isLocating).toBe(false);
  });
});

