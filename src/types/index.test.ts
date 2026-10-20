import { describe, it, expect } from 'vitest';
import type { Runestone, RunestoneFeature, RunestoneGeoJSON, RunestoneRow } from './index';

describe('types', () => {
  it('validates Runestone structure contracts', () => {
    const stone: Runestone = {
      id: 1,
      signature_text: 'U 1',
      found_location: 'Location',
      parish: 'Parish',
      district: 'District',
      municipality: 'Municipality',
      current_location: 'Current',
      material: 'Granite',
      rune_type: 'Runestone',
      dating: 'Viking Age',
      style: 'Pr2',
      carver: 'Öpir',
      latitude: 59.1,
      longitude: 18.1,
      lost: false,
      ornamental: false,
      recent: false,
    };

    expect(stone.id).toBe(1);
    expect(stone.signature_text).toBe('U 1');
    expect(stone.lost).toBe(false);
  });

  it('validates RunestoneFeature and GeoJSON contracts', () => {
    const feature: RunestoneFeature = {
      type: 'Feature',
      properties: {
        id: 1,
        signature_text: 'U 1',
        found_location: 'Location',
        parish: 'Parish',
        material: 'Granite',
        rune_type: 'Runestone',
        dating: 'Viking Age',
      },
      geometry: {
        type: 'Point',
        coordinates: [18.1, 59.1],
      },
    };

    const geoJson: RunestoneGeoJSON = {
      type: 'FeatureCollection',
      features: [feature],
    };

    expect(geoJson.type).toBe('FeatureCollection');
    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0].geometry.type).toBe('Point');
  });

  it('validates RunestoneRow contract', () => {
    const row: RunestoneRow = {
      id: 1,
      signature_text: 'U 1',
      found_location: 'Loc',
      parish: 'Par',
      district: 'Dist',
      municipality: 'Muni',
      current_location: 'Curr',
      material: 'Granite',
      material_type: null,
      rune_type: 'Runestone',
      dating: '1000',
      style: 'Pr2',
      carver: 'Öpir',
      latitude: 59.0,
      longitude: 18.0,
      english_translation: null,
      swedish_translation: null,
      norse_text: null,
      transliteration: null,
      lost: 0,
      ornamental: 0,
      recent: 0,
      visited: 1,
      slug: 'U_1',
      link_url: null,
      direct_url: null,
    };

    expect(row.lost).toBe(0);
    expect(row.visited).toBe(1);
  });
});

