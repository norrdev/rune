import { useRef, useEffect } from 'react';
import { Map as MapLibre, Marker as MapLibreMarker } from 'maplibre-gl';
import type { Runestone } from '../../types';
import '../../styles/map.web.css';
import { STYLE_URL, MINIMAP_ZOOM, MARKER_COLOR } from '../Map/mapUtils';

interface MiniMapProps {
  runestone: Runestone;
}

export const MiniMap = ({ runestone }: MiniMapProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);

  const { latitude: lat, longitude: lng } = runestone;

  useEffect(() => {
    const container = mapContainer.current;

    if (!container || typeof lat !== 'number' || typeof lng !== 'number') {
      return;
    }

    const map = new MapLibre({
      container,
      center: [lng, lat],
      zoom: MINIMAP_ZOOM,
      style: STYLE_URL,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    const marker = new MapLibreMarker({ color: MARKER_COLOR })
      .setLngLat([lng, lat])
      .addTo(map);

    markerRef.current = marker;

    const handleLoad = () => {
      map.resize();
    };

    map.on('load', handleLoad);

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng]);

  if (!runestone.latitude || !runestone.longitude) {
    return (
      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Location data not available</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <span className="font-semibold text-lg">Location</span>
      </div>
      <div ref={mapContainer} className="h-48 w-full" />
    </div>
  );
};
