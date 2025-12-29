import { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Map, Marker } from 'maplibre-gl';
import { Runestone } from '../types';
import '../styles/map.web.css';

interface MiniMapProps {
    runestone: Runestone;
}

export const MiniMap = ({ runestone }: MiniMapProps) => {
    const mapContainer = useRef<View | null>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        // In react-native-web, the ref of a View is the DOM element
        const container = mapContainer.current as unknown as HTMLElement;

        // Explicitly check for null/undefined/NaN and non-numeric types
        const lat = runestone.latitude;
        const lng = runestone.longitude;


        const map = new Map({
            container: container,
            center: [lng, lat],
            zoom: 14,
            style: 'https://tiles.openfreemap.org/styles/bright',
            interactive: false,
        });

        mapRef.current = map;

        const addMarker = () => {
            if (!mapRef.current) return;

            const markerEl = document.createElement('div');
            markerEl.style.width = '24px';
            markerEl.style.height = '24px';
            markerEl.style.backgroundColor = '#ef4444';
            markerEl.style.border = '2px solid white';
            markerEl.style.borderRadius = '50%';
            markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            markerEl.style.display = 'block';

            new Marker({ element: markerEl })
                .setLngLat([lng, lat])
                .addTo(mapRef.current);
        };

        if (map.loaded()) {
            console.log('MiniMap: Map loaded', lat, lng);
            addMarker();
        } else {
            console.log('MiniMap: Map not loaded', lat, lng);
            map.once('load', addMarker);
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
