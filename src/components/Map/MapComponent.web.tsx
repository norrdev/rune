import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import '../../styles/map.web.css';
import { GeolocateControl, Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import { runestonesCache } from '@services/Cache/runestonesCache';
import type { Runestone } from '../../types';
import { RunestoneModal } from '../RunestoneModal';
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

  const fetchAllRunestones = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all runestones from IDB cache (which will fall back to Supabase if needed)
      const allRunestones = await runestonesCache.getAllRunestones();

      // Apply visited status using the store
      const runestonesWithVisitedStatus = visitedRunestonesStore.applyVisitedStatus(allRunestones);

      runestonesRef.current = runestonesWithVisitedStatus;
      setRunestones(runestonesWithVisitedStatus);
    } catch (error) {
      console.error('Error fetching runestones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const geoJsonData = useMemo(() => {
    const runestonesWithCurrentVisitedStatus = visitedRunestonesStore.applyVisitedStatus(runestones);
    return createGeoJSONData(runestonesWithCurrentVisitedStatus);
  }, [runestones]);

  const updateClusters = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Make sure the map style is loaded before adding layers
    if (!map.isStyleLoaded()) {
      // Reset event listeners flag since style is changing
      eventListenersAddedRef.current = false;

      // Clear any existing timeout to prevent multiple timeouts
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
      }

      // Add timeout fallback in case styledata never fires (e.g., due to OpenFreeMap connectivity issues)
      styleTimeoutRef.current = setTimeout(() => {
        console.warn('Style loading timeout, attempting to add layers anyway');
        styleTimeoutRef.current = null; // Clear the reference
        if (mapRef.current?.isStyleLoaded()) {
          updateClusters();
        } else {
          console.error('Style failed to load completely. Skipping layer addition to prevent infinite loop.');
        }
      }, 10000); // 10 second timeout

      map.once('styledata', () => {
        if (styleTimeoutRef.current) {
          clearTimeout(styleTimeoutRef.current);
          styleTimeoutRef.current = null;
        }
        updateClusters();
      });
      return;
    }

    // Remove existing layers and sources
    try {
      if (map.getLayer('clusters')) {
        map.removeLayer('clusters');
      }
      if (map.getLayer('cluster-count')) {
        map.removeLayer('cluster-count');
      }
      if (map.getLayer('unclustered-point-unvisited')) {
        map.removeLayer('unclustered-point-unvisited');
      }
      if (map.getLayer('unclustered-point-visited')) {
        map.removeLayer('unclustered-point-visited');
      }
      if (map.getSource('runestones')) {
        map.removeSource('runestones');
      }
    } catch (error) {
      console.error('Error removing layers:', error);
    }

    try {
      // Check if source already exists and try to update it first
      const existingSource = map.getSource('runestones') as GeoJSONSource;
      if (existingSource) {
        existingSource.setData(geoJsonData);
        return;
      }

      // Add source with clustering
      map.addSource('runestones', {
        type: 'geojson',
        data: geoJsonData,
        cluster: true,
        clusterMaxZoom: 13, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      });

      // Add cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'runestones',
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
        id: 'cluster-count',
        type: 'symbol',
        source: 'runestones',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-size': 12,
          'text-font': ['Noto Sans Regular'],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Add individual runestone points (unclustered) - unvisited runestones
      map.addLayer({
        id: 'unclustered-point-unvisited',
        type: 'circle',
        source: 'runestones',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], false]],
        paint: {
          'circle-color': '#FF0000',
          'circle-radius': 9,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      // Add individual runestone points (unclustered) - visited runestones
      map.addLayer({
        id: 'unclustered-point-visited',
        type: 'circle',
        source: 'runestones',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], true]],
        paint: {
          'circle-color': '#00FF00',
          'circle-radius': 9,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      // Add event listeners (only add once per component lifecycle)
      if (!eventListenersAddedRef.current) {
        eventListenersAddedRef.current = true;

        // Click event for clusters - zoom in
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource('runestones') as GeoJSONSource;

          if (source && clusterId !== undefined) {
            source
              .getClusterExpansionZoom(clusterId)
              .then((zoom: number) => {
                const coordinates = (features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
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
        map.on('click', 'unclustered-point-unvisited', (e) => {
          const feature = e.features?.[0];
          if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return;

          const properties = feature.properties!;

          // Find the full runestone data using the id
          const runestone = runestones.find((stone) => stone.id === properties.id);
          if (!runestone) return;

          // Open the modal with this runestone
          openModal(runestone);
        });

        map.on('click', 'unclustered-point-visited', (e) => {
          const feature = e.features?.[0];
          if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return;

          const properties = feature.properties!;

          // Find the full runestone data using the id
          const runestone = runestones.find((stone) => stone.id === properties.id);
          if (!runestone) return;

          // Open the modal with this runestone
          openModal(runestone);
        });

        // Change cursor to pointer when hovering over clusters or points
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point-unvisited', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point-unvisited', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point-visited', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point-visited', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    } catch (error) {
      console.error('Error adding clustering layers:', error);
    }
  }, [geoJsonData, openModal, runestones]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      const map = new MapLibreMap({
        container: mapContainer.current!,
        center: JARLABANKE_BRIDGE,
        zoom: 13,
        style: STYLE_URL,
      });

      mapRef.current = map;

      // Fetch all runestones when map loads initially
      map.on('load', () => {
        fetchAllRunestones();
      });

      map.addControl(
        new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );
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

  // React to changes in visited runestones store
  useEffect(() => {
    if (runestonesRef.current.length > 0) {
      refreshVisitedStatus();
    }
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
            zoom: 16, // Close zoom to show the runestone clearly
            duration: 2000, // 2 second animation
          });

          // Open the modal for the selected runestone
          openModal(runestone);

          // Clear selected runestone after navigation
          searchStore.setSelectedRunestone(null);
        }
      }
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
