import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import '../../styles/map.web.css';
import { Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import { runestonesCache } from '@services/Cache/runestonesCache';
import type { Runestone } from '../../types';
import { RunestoneModal } from '../Runestone/RunestoneModal';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

import { searchStore } from '@stores/searchStore';
import { visitedRunestonesStore } from '@stores/visitedRunestonesStore';
import {
  STYLE_URL,
  JARLABANKE_BRIDGE,
  CLUSTER_COLORS,
  CLUSTER_RADIUSES,
  CLUSTER_THRESHOLDS,
  createGeoJSONData,
  DEFAULT_ZOOM_WEB,
  SEARCH_ZOOM_WEB,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  CAMERA_ANIMATION_DURATION_WEB,
  UNVISITED_MARKER_COLOR,
  VISITED_MARKER_COLOR,
  MARKER_RADIUS_WEB,
  MARKER_STROKE_WIDTH_WEB,
  MARKER_STROKE_COLOR,
  CLUSTER_COUNT_TEXT_SIZE,
  CLUSTER_COUNT_TEXT_COLOR,
  CLUSTER_COUNT_FONT_WEB,
  LAYER_IDS,
  RUNESTONES_SOURCE_ID,
} from './mapUtils';

interface MapComponentProps {
  onVisitedCountChange?: (count: number) => void;
}

export const MapComponent = observer(({ onVisitedCountChange }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const eventListenersAddedRef = useRef<boolean>(false);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runestonesRef = useRef<Runestone[]>([]);
  const [runestones, setRunestones] = useState<Runestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Modal state
  const [selectedRunestone, setSelectedRunestone] = useState<Runestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to open modal with a runestone
  const openModal = useCallback((runestone: Runestone) => {
    setSelectedRunestone(runestone);
    setIsModalOpen(true);
  }, []);

  // Function to close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRunestone(null);
  }, []);

  // Function to refresh visited status (now simply applies the current visited state)
  const refreshVisitedStatus = useCallback(() => {
    const updatedRunestones = visitedRunestonesStore.applyVisitedStatus(runestonesRef.current);
    runestonesRef.current = updatedRunestones;
    setRunestones(updatedRunestones);
  }, []);

  const handleLocationPress = useCallback(() => {
    if (!mapRef.current) return;

    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: CAMERA_ANIMATION_DURATION_WEB,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please check your browser permissions.');
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
    }
  }, []);

  const handleCompassPress = useCallback(() => {
    if (!mapRef.current) return;

    mapRef.current.easeTo({
      bearing: 0,
      duration: CAMERA_ANIMATION_DURATION_WEB,
    });
  }, []);

  const fetchAllRunestones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all runestones from IDB cache (which will fall back to Supabase if needed)
      const allRunestones = await runestonesCache.getAllRunestones();

      // Apply visited status using the store
      const runestonesWithVisitedStatus = visitedRunestonesStore.applyVisitedStatus(allRunestones);

      runestonesRef.current = runestonesWithVisitedStatus;
      setRunestones(runestonesWithVisitedStatus);
    } catch (error) {
      console.error('Error fetching runestones:', error);
      setError('Failed to load runestones. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const geoJsonData = useMemo(() => {
    const runestonesWithCurrentVisitedStatus =
      visitedRunestonesStore.applyVisitedStatus(runestones);
    return createGeoJSONData(runestonesWithCurrentVisitedStatus);
  }, [runestones]);

  const updateClusters = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Check style loaded status
    const isStyleLoaded = map.isStyleLoaded();

    // Make sure the map style is loaded before adding layers
    if (!isStyleLoaded) {
      // Reset event listeners flag since style is changing
      eventListenersAddedRef.current = false;

      // Clear any existing timeout to prevent multiple timeouts
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
        styleTimeoutRef.current = null;
      }

      // Add timeout fallback in case styledata never fires
      styleTimeoutRef.current = setTimeout(() => {
        console.warn('Style loading timeout, attempting to add layers anyway');
        styleTimeoutRef.current = null;
        if (mapRef.current) {
          updateClusters();
        }
      }, 2000); // Reduced to 2 seconds for faster retry

      map.once('styledata', () => {
        if (styleTimeoutRef.current) {
          clearTimeout(styleTimeoutRef.current);
          styleTimeoutRef.current = null;
        }
        updateClusters();
      });
      return;
    }

    try {
      // Check if source already exists
      const existingSource = map.getSource(RUNESTONES_SOURCE_ID) as GeoJSONSource;

      if (existingSource) {
        // Just update data if source exists
        existingSource.setData(geoJsonData);
      } else {
        // Add source and layers if they don't exist

        // Add source with clustering
        map.addSource(RUNESTONES_SOURCE_ID, {
          type: 'geojson',
          data: geoJsonData,
          cluster: true,
          clusterMaxZoom: CLUSTER_MAX_ZOOM, // Max zoom to cluster points on
          clusterRadius: CLUSTER_RADIUS, // Radius of each cluster when clustering points
        });

        // Add cluster circles
        map.addLayer({
          id: LAYER_IDS.CLUSTERS,
          type: 'circle',
          source: RUNESTONES_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              CLUSTER_COLORS.SMALL,
              CLUSTER_THRESHOLDS.MEDIUM,
              CLUSTER_COLORS.MEDIUM,
              CLUSTER_THRESHOLDS.LARGE,
              CLUSTER_COLORS.LARGE,
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              CLUSTER_RADIUSES.SMALL,
              CLUSTER_THRESHOLDS.MEDIUM,
              CLUSTER_RADIUSES.MEDIUM,
              CLUSTER_THRESHOLDS.LARGE,
              CLUSTER_RADIUSES.LARGE,
            ],
          },
        });

        // Add cluster count labels
        map.addLayer({
          id: LAYER_IDS.CLUSTER_COUNT,
          type: 'symbol',
          source: RUNESTONES_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count}',
            'text-size': CLUSTER_COUNT_TEXT_SIZE,
            // Use a broader font stack or a standard one that is likely to be available
            'text-font': CLUSTER_COUNT_FONT_WEB,
          },
          paint: {
            'text-color': CLUSTER_COUNT_TEXT_COLOR,
          },
        });

        // Add individual runestone points (unclustered) - unvisited runestones
        map.addLayer({
          id: LAYER_IDS.UNVISITED,
          type: 'circle',
          source: RUNESTONES_SOURCE_ID,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], false]],
          paint: {
            'circle-color': UNVISITED_MARKER_COLOR,
            'circle-radius': MARKER_RADIUS_WEB,
            'circle-stroke-width': MARKER_STROKE_WIDTH_WEB,
            'circle-stroke-color': MARKER_STROKE_COLOR,
          },
        });

        // Add individual runestone points (unclustered) - visited runestones
        map.addLayer({
          id: LAYER_IDS.VISITED,
          type: 'circle',
          source: RUNESTONES_SOURCE_ID,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], true]],
          paint: {
            'circle-color': VISITED_MARKER_COLOR,
            'circle-radius': MARKER_RADIUS_WEB,
            'circle-stroke-width': MARKER_STROKE_WIDTH_WEB,
            'circle-stroke-color': MARKER_STROKE_COLOR,
          },
        });

        // Add event listeners (only add once per component lifecycle)
        if (!eventListenersAddedRef.current) {
          eventListenersAddedRef.current = true;

          // Click event for clusters - zoom in
          map.on('click', LAYER_IDS.CLUSTERS, (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: [LAYER_IDS.CLUSTERS],
            });
            const clusterId = features[0].properties?.cluster_id;
            const source = map.getSource(RUNESTONES_SOURCE_ID) as GeoJSONSource;

            if (source && clusterId !== undefined) {
              source
                .getClusterExpansionZoom(clusterId)
                .then((zoom: number) => {
                  const coordinates = (
                    features[0].geometry as unknown as { coordinates: [number, number] }
                  ).coordinates;
                  map.easeTo({
                    center: coordinates,
                    zoom: zoom,
                  });
                })
                .catch((err: Error) => {
                  console.error('Error getting cluster expansion zoom:', err);
                });
            }
          });

          // Click event for individual runestones - open modal (both visited and unvisited)
          const onPointClick = (e: any) => {
            const feature = e.features?.[0];
            if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return;

            const properties = feature.properties!;

            // Find the full runestone data using the id
            const runestone = runestones.find((stone) => stone.id === properties.id);
            if (!runestone) return;

            // Open the modal with this runestone
            openModal(runestone);
          };

          map.on('click', LAYER_IDS.UNVISITED, onPointClick);
          map.on('click', LAYER_IDS.VISITED, onPointClick);

          // Change cursor to pointer when hovering over clusters or points
          const setPointer = () => {
            map.getCanvas().style.cursor = 'pointer';
          };
          const resetCursor = () => {
            map.getCanvas().style.cursor = '';
          };

          map.on('mouseenter', LAYER_IDS.CLUSTERS, setPointer);
          map.on('mouseleave', LAYER_IDS.CLUSTERS, resetCursor);
          map.on('mouseenter', LAYER_IDS.UNVISITED, setPointer);
          map.on('mouseleave', LAYER_IDS.UNVISITED, resetCursor);
          map.on('mouseenter', LAYER_IDS.VISITED, setPointer);
          map.on('mouseleave', LAYER_IDS.VISITED, resetCursor);
        }
      }
    } catch (error) {
      console.error('Error updating map layers:', error);
    }
  }, [geoJsonData, openModal, runestones]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      const map = new MapLibreMap({
        container: mapContainer.current!,
        center: JARLABANKE_BRIDGE,
        zoom: DEFAULT_ZOOM_WEB,
        style: STYLE_URL,
      });

      mapRef.current = map;

      // Fetch all runestones when map loads initially
      map.on('load', () => {
        fetchAllRunestones();
      });
    };

    initMap();

    return () => {
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [fetchAllRunestones]);

  // Update clusters when runestones change
  useEffect(() => {
    if (mapRef.current && runestones.length > 0) {
      // Add a small delay to ensure map is fully ready
      const timer = setTimeout(() => {
        updateClusters();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [updateClusters, runestones.length]);

  // React to changes in visited runestones store using reaction
  useEffect(() => {
    // We use a reaction to MobX store changes to update our local state
    const dispose = reaction(
      () => visitedRunestonesStore.visitedCount, // Track visited count changes
      () => {
        refreshVisitedStatus();
      },
    );

    return () => dispose();
  }, [refreshVisitedStatus]);

  // Fetch runestones when component mounts
  useEffect(() => {
    if (runestones.length === 0) {
      fetchAllRunestones();
    }
  }, [runestones.length, fetchAllRunestones]);

  useEffect(() => {
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
  }, [onVisitedCountChange]);

  // Navigate to selected runestone
  useEffect(() => {
    const dispose = reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone && mapRef.current) {
          const map = mapRef.current;

          // Fly to the runestone's location
          map.flyTo({
            center: [runestone.longitude, runestone.latitude],
            zoom: SEARCH_ZOOM_WEB, // Close zoom to show the runestone clearly
            duration: CAMERA_ANIMATION_DURATION_WEB, // Unified animation duration
          });

          // Open the modal for the selected runestone
          openModal(runestone);

          // Clear selected runestone after navigation
          searchStore.setSelectedRunestone(null);
        }
      },
    );

    return () => dispose();
  }, [openModal]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg z-[1001]">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Loading runestones...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-[1001] border border-red-200 max-w-sm text-center">
          <div className="text-red-600 font-medium mb-2">Error</div>
          <p className="text-gray-700 text-sm mb-3">{error}</p>
          <button
            type="button"
            onClick={() => fetchAllRunestones()}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !error && runestones.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg z-[1001]">
          <p className="text-gray-700 font-medium">No runestones found</p>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-[1000]">
        {/* Location Button */}
        <button
          type="button"
          onClick={handleLocationPress}
          disabled={isLocating}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Go to my location"
        >
          {isLocating ? (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <span className="text-2xl">📍</span>
          )}
        </button>

        {/* Compass Button */}
        <button
          type="button"
          onClick={handleCompassPress}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer"
          title="Reset map orientation"
        >
          <span className="text-2xl">🧭</span>
        </button>
      </div>

      {/* Runestone Modal */}
      <RunestoneModal
        runestone={selectedRunestone}
        isOpen={isModalOpen}
        onClose={closeModal}
        onVisitedStatusChange={refreshVisitedStatus}
      />
    </div>
  );
});
