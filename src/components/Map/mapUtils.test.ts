import { describe, it, expect, vi } from 'vitest';
import {
  JARLABANKE_BRIDGE,
  STYLE_URL,
  CLUSTER_COLORS,
  CLUSTER_RADIUSES,
  CLUSTER_THRESHOLDS,
  LAYER_IDS,
  RUNESTONES_SOURCE_ID,
  createGeoJSONData,
  addMapSourcesAndLayers,
} from './mapUtils';
import type { Runestone } from '../../types';
import type { Map as MapLibreMap } from 'maplibre-gl';

describe('mapUtils', () => {
  const sampleStone: Runestone = {
    id: 1,
    signature_text: 'U 1',
    found_location: 'Location 1',
    parish: 'Parish 1',
    district: 'District 1',
    municipality: 'Municipality 1',
    current_location: 'Location 1',
    material: 'Granite',
    material_type: 'Granite slab',
    rune_type: 'Runestone',
    dating: 'Viking Age',
    style: 'Pr2',
    carver: 'Öpir',
    latitude: 59.4,
    longitude: 18.0,
    english_translation: 'In memory of father',
    swedish_translation: 'Till minne av fader',
    norse_text: 'Norse text',
    transliteration: 'Transliteration',
    lost: false,
    ornamental: false,
    recent: false,
    visited: true,
  };

  it('exports expected constants', () => {
    expect(JARLABANKE_BRIDGE).toEqual([18.0686, 59.4293]);
    expect(STYLE_URL).toContain('openfreemap');
    expect(CLUSTER_COLORS.SMALL).toBe('#2dd4bf');
    expect(CLUSTER_RADIUSES.SMALL).toBe(20);
    expect(CLUSTER_THRESHOLDS.MEDIUM).toBe(100);
    expect(LAYER_IDS.CLUSTERS).toBe('clusters');
    expect(RUNESTONES_SOURCE_ID).toBe('runestones');
  });

  describe('createGeoJSONData', () => {
    it('creates empty FeatureCollection for empty array', () => {
      const geojson = createGeoJSONData([]);
      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features).toEqual([]);
    });

    it('creates geojson features from stones', () => {
      const geojson = createGeoJSONData([sampleStone]);
      expect(geojson.features.length).toBe(1);
      const feature = geojson.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.coordinates).toEqual([18.0, 59.4]);
      expect(feature.properties.id).toBe(1);
      expect(feature.properties.signature_text).toBe('U 1');
      expect(feature.properties.visited).toBe(true);
      expect(feature.properties.overlapping_count).toBe(1);
    });

    it('filters out duplicates by id', () => {
      const duplicateStone = { ...sampleStone };
      const geojson = createGeoJSONData([sampleStone, duplicateStone]);
      expect(geojson.features.length).toBe(1);
    });

    it('handles overlapping coordinates with small offsets for secondary stones', () => {
      const stone2: Runestone = {
        ...sampleStone,
        id: 2,
        signature_text: 'U 2',
      };

      const geojson = createGeoJSONData([sampleStone, stone2]);
      expect(geojson.features.length).toBe(2);
      expect(geojson.features[0].properties.overlapping_count).toBe(2);
      expect(geojson.features[1].properties.overlapping_count).toBe(2);

      // First stone has original coordinates
      expect(geojson.features[0].geometry.coordinates).toEqual([18.0, 59.4]);
      // Second stone has offset coordinates
      expect(geojson.features[1].geometry.coordinates[0]).not.toBe(18.0);
      expect(geojson.features[1].geometry.coordinates[1]).not.toBe(59.4);
    });

    it('handles missing or NaN coordinates gracefully', () => {
      const stoneWithNaN: Runestone = {
        ...sampleStone,
        id: 3,
        latitude: Number.NaN,
        longitude: Number.NaN,
      };

      const geojson = createGeoJSONData([stoneWithNaN]);
      expect(geojson.features.length).toBe(1);
      expect(geojson.features[0].geometry.coordinates).toEqual([0, 0]);
    });
  });

  describe('addMapSourcesAndLayers', () => {
    it('configures map sources, layers, and event listeners', async () => {
      const handlers: Record<string, (...args: unknown[]) => void> = {};
      const layersAdded: unknown[] = [];
      const sourcesAdded: Record<string, unknown> = {};

      const mockSource = {
        getClusterExpansionZoom: vi.fn().mockResolvedValue(12),
      };

      const mockMap = {
        addSource: vi.fn((id, source) => {
          sourcesAdded[id] = source;
        }),
        addLayer: vi.fn((layer) => {
          layersAdded.push(layer);
        }),
        getSource: vi.fn(() => mockSource),
        easeTo: vi.fn(),
        queryRenderedFeatures: vi.fn().mockReturnValue([
          {
            properties: { cluster_id: 42 },
            geometry: { coordinates: [18.0, 59.4] },
          },
        ]),
        on: vi.fn((event, layerOrHandler, maybeHandler) => {
          const key = typeof layerOrHandler === 'string' ? `${event}:${layerOrHandler}` : event;
          const handler = typeof layerOrHandler === 'string' ? maybeHandler : layerOrHandler;
          handlers[key] = handler;
        }),
        getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
      } as unknown as MapLibreMap;

      const geoJsonData = createGeoJSONData([sampleStone]);
      const onRunestoneClick = vi.fn();
      const getRunestones = vi.fn().mockReturnValue([sampleStone]);

      addMapSourcesAndLayers(mockMap, geoJsonData, onRunestoneClick, getRunestones);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        RUNESTONES_SOURCE_ID,
        expect.objectContaining({ type: 'geojson', cluster: true }),
      );
      expect(mockMap.addLayer).toHaveBeenCalledTimes(4);

      // Verify cluster click zooms in
      const clusterClickHandler = handlers[`click:${LAYER_IDS.CLUSTERS}`];
      expect(clusterClickHandler).toBeDefined();
      clusterClickHandler({ point: { x: 10, y: 10 } });
      await Promise.resolve(); // wait for getClusterExpansionZoom promise
      expect(mockMap.easeTo).toHaveBeenCalledWith({
        center: [18.0, 59.4],
        zoom: 12,
      });

      // Verify point click invokes callback
      const pointClickHandler = handlers[`click:${LAYER_IDS.UNVISITED}`];
      expect(pointClickHandler).toBeDefined();
      pointClickHandler({
        features: [
          {
            geometry: { type: 'Point', coordinates: [18.0, 59.4] },
            properties: { id: 1 },
          },
        ],
      });
      expect(onRunestoneClick).toHaveBeenCalledWith(sampleStone);

      // Verify hover cursor behavior
      const mouseEnter = handlers[`mouseenter:${LAYER_IDS.CLUSTERS}`];
      const mouseLeave = handlers[`mouseleave:${LAYER_IDS.CLUSTERS}`];
      mouseEnter();
      expect(mockMap.getCanvas().style.cursor).toBe('pointer');
      mouseLeave();
      expect(mockMap.getCanvas().style.cursor).toBe('');
    });
  });
});

