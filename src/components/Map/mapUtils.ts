import type { Runestone, RunestoneFeature, RunestoneGeoJSON } from '../../types';
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';

// Initial center (Stockholm area - Jarlabanke bridge)
export const JARLABANKE_BRIDGE: [number, number] = [18.0686, 59.4293];

// OpenFreeMap - detailed street maps
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

// Cluster styling constants
export const CLUSTER_COLORS = {
  SMALL: '#8B4513', // Dark brown for clusters with < 100 points
  MEDIUM: '#A0522D', // Medium brown for clusters with 100-750 points
  LARGE: '#CD853F', // Light brown for clusters with > 750 points
} as const;

export const CLUSTER_RADIUSES = {
  SMALL: 20, // Radius for clusters with < 100 points
  MEDIUM: 30, // Radius for clusters with 100-750 points
  LARGE: 40, // Radius for clusters with > 750 points
} as const;

export const CLUSTER_THRESHOLDS = {
  MEDIUM: 100, // Threshold for medium clusters
  LARGE: 750, // Threshold for large clusters
} as const;

export const DEFAULT_ZOOM_NATIVE = 10;
export const DEFAULT_ZOOM_WEB = 13;
export const SEARCH_ZOOM_NATIVE = 14;
export const SEARCH_ZOOM_WEB = 16;

export const CLUSTER_MAX_ZOOM = 13;
export const CAMERA_ANIMATION_DURATION_NATIVE = 1000;
export const CAMERA_ANIMATION_DURATION_WEB = 2000;
export const CLUSTER_RADIUS = 50;

export const UNVISITED_MARKER_COLOR = '#ef4444';
export const VISITED_MARKER_COLOR = '#22c55e';
export const MARKER_RADIUS_NATIVE = 8;
export const MARKER_RADIUS_WEB = 9;
export const MARKER_STROKE_WIDTH_NATIVE = 2;
export const MARKER_STROKE_WIDTH_WEB = 3;
export const MARKER_STROKE_COLOR = '#ffffff';

export const CLUSTER_COUNT_TEXT_SIZE = 12;
export const CLUSTER_COUNT_TEXT_COLOR = '#ffffff';
export const CLUSTER_COUNT_FONT_NATIVE = ['Noto Sans Regular'];
export const CLUSTER_COUNT_FONT_WEB = ['Noto Sans Regular', 'Arial Unicode MS Regular'];

export const RUNESTONES_SOURCE_ID = 'runestones';

export const LAYER_IDS = {
  CLUSTERS: 'clusters',
  CLUSTER_COUNT: 'cluster-count',
  UNVISITED: 'unvisited-runestones',
  VISITED: 'visited-runestones',
} as const;

// For web, we used different IDs previously, let's keep them if needed, but the constants above should work if updated everywhere.
// Web originally had: unclustered-point-unvisited, unclustered-point-visited.
// Native had: unvisited-runestones, visited-runestones.
// I'll stick to the unified IDs but restore the other properties.

export const LOADING_INDICATOR_COLOR = '#866c53';

export const MINIMAP_ZOOM = 14;
export const MARKER_COLOR = UNVISITED_MARKER_COLOR;

/**
 * Creates GeoJSON features from an array of runestones, handling duplicates
 * and overlapping coordinates with small offsets.
 */
export const createGeoJSONData = (stones: Runestone[]): RunestoneGeoJSON => {
  // Check for and remove duplicates based on id
  const uniqueStones = stones.filter(
    (stone, index, arr) => arr.findIndex((s) => s.id === stone.id) === index,
  );

  // Group stones by coordinates to handle overlapping locations
  const coordinateGroups = uniqueStones.reduce((acc: Record<string, Runestone[]>, stone) => {
    // Robustly handle missing or invalid coordinates
    const lng =
      typeof stone.longitude === 'number' && !Number.isNaN(stone.longitude) ? stone.longitude : 0;
    const lat =
      typeof stone.latitude === 'number' && !Number.isNaN(stone.latitude) ? stone.latitude : 0;

    const coordKey = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    acc[coordKey] = acc[coordKey] || [];
    acc[coordKey].push(stone);
    return acc;
  }, {});

  // Create features with slight offsets for overlapping stones
  const features: RunestoneFeature[] = [];
  Object.values(coordinateGroups).forEach((stonesAtLocation) => {
    stonesAtLocation.forEach((stone, index) => {
      // Robustly handle missing or invalid coordinates
      const baseLng =
        typeof stone.longitude === 'number' && !Number.isNaN(stone.longitude) ? stone.longitude : 0;
      const baseLat =
        typeof stone.latitude === 'number' && !Number.isNaN(stone.latitude) ? stone.latitude : 0;

      // Add small offset for overlapping stones (except the first one)
      const offset = index * 0.00005; // Very small offset (~5.5 meters)
      const offsetLng = baseLng + (index > 0 ? offset * Math.cos(index) : 0);
      const offsetLat = baseLat + (index > 0 ? offset * Math.sin(index) : 0);

      features.push({
        type: 'Feature',
        properties: {
          id: stone.id,
          signature_text: stone.signature_text,
          found_location: stone.found_location,
          parish: stone.parish,
          material: stone.material,
          material_type: stone.material_type,
          rune_type: stone.rune_type,
          dating: stone.dating,
          english_translation: stone.english_translation,
          swedish_translation: stone.swedish_translation,
          norse_text: stone.norse_text,
          transliteration: stone.transliteration,
          overlapping_count: stonesAtLocation.length,
          original_coordinates: [baseLng, baseLat],
          visited: !!stone.visited,
        },
        geometry: {
          type: 'Point',
          coordinates: [offsetLng, offsetLat],
        },
      });
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
};

/**
 * Adds map sources and layers for runestones with clustering support (web only).
 * This extracts the complex layer setup logic from the component.
 */
export const addMapSourcesAndLayers = (
  map: MapLibreMap,
  geoJsonData: RunestoneGeoJSON,
  onRunestoneClick: (runestone: Runestone) => void,
  runestones: Runestone[],
): void => {
  // Add source with clustering
  map.addSource(RUNESTONES_SOURCE_ID, {
    type: 'geojson',
    data: geoJsonData,
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_RADIUS,
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

  // Add event listeners
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
          const coordinates = (features[0].geometry as unknown as { coordinates: [number, number] })
            .coordinates;
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
    onRunestoneClick(runestone);
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
};
