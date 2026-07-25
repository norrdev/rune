import { useEffect, useRef, useCallback } from 'react';
import { MapPin, Compass } from 'lucide-react';
import '../../styles/map.web.css';
import { Map as MapLibreMap, Marker as MapLibreMarker, type GeoJSONSource } from 'maplibre-gl';
import { RunestoneModal } from '../Runestone/RunestoneModal';
import { observer } from 'mobx-react-lite';
import { mapStore } from '@stores/mapStore';
import { STYLE_URL, RUNESTONES_SOURCE_ID, addMapSourcesAndLayers } from './mapUtils';

export const MapComponent = observer(function MapComponent() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);

  const {
    userLocation,
    mapInstance,
    geoJsonData,
    runestones,
    hasRunestones,
    loading,
    error,
    isLocating,
    selectedRunestone,
    isModalOpen,
  } = mapStore;

  // User location marker synchronization
  // biome-ignore lint/correctness/useExhaustiveDependencies: userLocation and mapInstance are MobX store observables
  useEffect(() => {
    if (!mapInstance) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const [lng, lat] = userLocation;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';

      const marker = new MapLibreMarker({ element: el }).setLngLat([lng, lat]).addTo(mapInstance);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, mapInstance]);

  // Initialize map on mount
  useEffect(() => {
    if (!mapContainer.current) return;

    mapStore.setPlatform('web');

    const map = new MapLibreMap({
      container: mapContainer.current,
      center: mapStore.center,
      zoom: mapStore.zoom,
      style: STYLE_URL,
    });

    map.on('load', () => {
      mapStore.setMapInstance(map);
      mapStore.loadRunestones();
    });

    return () => {
      map.remove();
      mapStore.setMapInstance(null);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mapInstance, geoJsonData, and runestones are MobX store observables
  const updateMapLayers = useCallback(() => {
    if (!mapInstance) return;

    const source = mapInstance.getSource(RUNESTONES_SOURCE_ID) as GeoJSONSource;

    if (source) {
      // Source already exists on mapInstance: update data
      source.setData(geoJsonData);
    } else {
      // Source does not exist on mapInstance: add source and layers
      try {
        addMapSourcesAndLayers(
          mapInstance,
          geoJsonData,
          (runestone) => mapStore.openModal(runestone),
          runestones,
        );
      } catch (err) {
        console.error('Error adding map layers:', err);
      }
    }
  }, [mapInstance, geoJsonData, runestones]);

  // Update map layers when geoJsonData or hasRunestones changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateMapLayers, mapInstance, and hasRunestones are MobX store observables
  useEffect(() => {
    if (!mapInstance || !hasRunestones) return;

    // Wait for style to be loaded if not ready yet
    if (!mapInstance.isStyleLoaded()) {
      const handler = () => {
        if (hasRunestones) {
          updateMapLayers();
        }
      };
      mapInstance.once('styledata', handler);
      return () => {
        mapInstance.off('styledata', handler);
      };
    }

    updateMapLayers();
  }, [updateMapLayers, mapInstance, hasRunestones]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg z-1001">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Loading runestones...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-1001 border border-red-200 max-w-sm text-center">
          <div className="text-red-600 font-medium mb-2">Error</div>
          <p className="text-gray-700 text-sm mb-3">{error}</p>
          <button
            type="button"
            onClick={() => mapStore.loadRunestones()}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded text-sm font-medium transition-colors min-h-[48px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !error && !hasRunestones && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-1001">
          <p className="text-gray-700 font-medium">No runestones found</p>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-1000">
        {/* Location Button */}
        <button
          type="button"
          onClick={() => mapStore.getCurrentLocation()}
          disabled={isLocating}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Go to my location"
        >
          {isLocating ? (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <MapPin size={24} color="#1f2937" />
          )}
        </button>

        {/* Compass Button */}
        <button
          type="button"
          onClick={() => mapStore.resetBearing()}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer"
          title="Reset map orientation"
        >
          <Compass size={24} color="#1f2937" />
        </button>
      </div>

      {/* Runestone Modal */}
      <RunestoneModal
        runestone={selectedRunestone}
        isOpen={isModalOpen}
        onClose={() => mapStore.closeModal()}
        onVisitedStatusChange={() => mapStore.refreshVisitedStatus()}
      />
    </div>
  );
});
