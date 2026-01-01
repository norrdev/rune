import { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Map as MapLibre } from 'maplibre-gl';
import type { Runestone } from '../../types';
import '../../styles/map.web.css';
import { STYLE_URL, MINIMAP_ZOOM, MARKER_COLOR } from '../Map/mapUtils';

interface MiniMapProps {
    runestone: Runestone;
}

export const MiniMap = ({ runestone }: MiniMapProps) => {
    const mapContainer = useRef<View | null>(null);
    const mapRef = useRef<MapLibre | null>(null);

    useEffect(() => {
        // In react-native-web, the ref of a View is the DOM element
        const container = mapContainer.current as unknown as HTMLElement;

        const lat = runestone.latitude;
        const lng = runestone.longitude;

        if (!container || typeof lat !== 'number' || typeof lng !== 'number') {
            return;
        }

        const map = new MapLibre({
            container: container,
            center: [lng, lat],
            zoom: MINIMAP_ZOOM,
            style: STYLE_URL,
            interactive: false,
            attributionControl: false,
        });

        mapRef.current = map;

        const addMarker = () => {
            if (!map || !map.getStyle()) return;

            // Check if source already exists to avoid errors on hot reload/re-renders
            if (map.getSource('stone-marker')) return;

            map.addSource('stone-marker', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [lng, lat]
                            },
                            'properties': {}
                        }
                    ]
                }
            });

            map.addLayer({
                'id': 'stone-marker-circle',
                'type': 'circle',
                'source': 'stone-marker',
                'paint': {
                    'circle-radius': 8,
                    'circle-color': MARKER_COLOR,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        };

        if (map.loaded()) {
            map.resize();
            addMarker();
        } else {
            map.once('load', () => {
                map?.resize();
                addMarker();
            });
        }

        map.on('error', (e) => {
            console.error('MiniMap: Map error', e);
        });



        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [runestone]);

    if (!runestone.latitude || !runestone.longitude) {
        return (
            <View className="bg-gray-100 h-48 rounded-lg items-center justify-center">
                <Text className="text-gray-500 text-sm">Location data not available</Text>
            </View>
        );
    }

    return (
        <View className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <View className="p-4 border-b border-gray-200">
                <Text className="font-semibol text-lg">Location</Text>
            </View>
            <View
                ref={mapContainer}
                className="h-48 w-full"
            />
        </View>
    );
};
