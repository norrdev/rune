import type { Runestone, RunestoneFeature, RunestoneGeoJSON } from '../../types';

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

export const MINIMAP_ZOOM = 14;
export const MARKER_COLOR = '#ef4444';

/**
 * Creates GeoJSON features from an array of runestones, handling duplicates
 * and overlapping coordinates with small offsets.
 */
export const createGeoJSONData = (stones: Runestone[]): RunestoneGeoJSON => {
  // Check for and remove duplicates based on id
  const uniqueStones = stones.filter(
    (stone, index, arr) => arr.findIndex((s) => s.id === stone.id) === index
  );

  // Group stones by coordinates to handle overlapping locations
  const coordinateGroups = uniqueStones.reduce((acc: Record<string, Runestone[]>, stone) => {
    // Robustly handle missing or invalid coordinates
    const lng = typeof stone.longitude === 'number' && !Number.isNaN(stone.longitude) ? stone.longitude : 0;
    const lat = typeof stone.latitude === 'number' && !Number.isNaN(stone.latitude) ? stone.latitude : 0;

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
      const baseLng = typeof stone.longitude === 'number' && !Number.isNaN(stone.longitude) ? stone.longitude : 0;
      const baseLat = typeof stone.latitude === 'number' && !Number.isNaN(stone.latitude) ? stone.latitude : 0;

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
