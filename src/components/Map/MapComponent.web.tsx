import { useEffect, useRef, useCallback } from 'react';
import '../../styles/map.web.css';
import { Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import { RunestoneModal } from '../Runestone/RunestoneModal';
import { observer } from 'mobx-react-lite';
import { visitedRunestonesStore } from '@stores/visitedRunestonesStore';
import { mapStore } from '@stores/mapStore';
import { STYLE_URL, RUNESTONES_SOURCE_ID, addMapSourcesAndLayers } from './mapUtils';

interface MapComponentProps {
  onVisitedCountChange?: (count: number) => void;
}

export const MapComponent = observer(({ onVisitedCountChange }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const layersAddedRef = useRef<boolean>(false);

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
      layersAddedRef.current = false;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const updateMapLayers = useCallback(() => {
    if (!mapStore.mapInstance) return;

    const map = mapStore.mapInstance;
    const source = map.getSource(RUNESTONES_SOURCE_ID) as GeoJSONSource;

    if (source) {
      // Just update data if source exists
      source.setData(mapStore.geoJsonData);
    } else if (!layersAddedRef.current) {
      // Add source and layers (one-time setup)
      try {
        addMapSourcesAndLayers(
          map,
          mapStore.geoJsonData,
          (runestone) => mapStore.openModal(runestone),
          mapStore.runestones,
        );
        layersAddedRef.current = true;
      } catch (error) {
        console.error('Error adding map layers:', error);
      }
    }
  }, [mapStore.geoJsonData, mapStore.runestones]); // Added dependencies for clarity

  // Update map layers when geoJsonData changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!mapStore.mapInstance || !mapStore.hasRunestones) return;

    const map = mapStore.mapInstance;

    // Wait for style to be loaded
    if (!map.isStyleLoaded()) {
      const handler = () => {
        if (mapStore.hasRunestones) {
          updateMapLayers();
        }
      };
      map.once('styledata', handler);
      return () => {
        map.off('styledata', handler);
      };
    }

    updateMapLayers();
  }, [updateMapLayers, mapStore.mapInstance, mapStore.hasRunestones]);

  // Notify parent of visited count changes
  const notifyVisitedCount = useCallback(() => {
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
  }, [onVisitedCountChange]);

  useEffect(() => {
    notifyVisitedCount();
  }, [notifyVisitedCount]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading indicator */}
      {mapStore.loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg z-[1001]">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Loading runestones...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {mapStore.error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-[1001] border border-red-200 max-w-sm text-center">
          <div className="text-red-600 font-medium mb-2">Error</div>
          <p className="text-gray-700 text-sm mb-3">{mapStore.error}</p>
          <button
            type="button"
            onClick={() => mapStore.loadRunestones()}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No Data Message */}
      {!mapStore.loading && !mapStore.error && !mapStore.hasRunestones && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-[1001]">
          <p className="text-gray-700 font-medium">No runestones found</p>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-[1000]">
        {/* Location Button */}
        <button
          type="button"
          onClick={() => mapStore.getCurrentLocation()}
          disabled={mapStore.isLocating}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Go to my location"
        >
          {mapStore.isLocating ? (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <span className="text-2xl">📍</span>
          )}
        </button>

        {/* Compass Button */}
        <button
          type="button"
          onClick={() => mapStore.resetBearing()}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer"
          title="Reset map orientation"
        >
          <span className="text-2xl">🧭</span>
        </button>
      </div>

      {/* Runestone Modal */}
      <RunestoneModal
        runestone={mapStore.selectedRunestone}
        isOpen={mapStore.isModalOpen}
        onClose={() => mapStore.closeModal()}
        onVisitedStatusChange={() => mapStore.refreshVisitedStatus()}
      />
    </div>
  );
});
