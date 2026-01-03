import { View, Text, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import type { Runestone } from '../../types';
import { STYLE_URL, MINIMAP_ZOOM, MARKER_COLOR } from '../Map/mapUtils';

// Initialize MapLibre (safe to call multiple times)
MapLibreGL.setAccessToken(null);

interface MiniMapProps {
    runestone: Runestone;
}

export const MiniMap = ({ runestone }: MiniMapProps) => {
    if (!runestone.latitude || !runestone.longitude) {
        return (
            <View className="bg-gray-100 h-48 rounded-lg items-center justify-center">
                <Text className="text-gray-500 text-sm">Location data not available</Text>
            </View>
        );
    }

    const coordinates: [number, number] = [runestone.longitude, runestone.latitude];

    return (
        <View className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <View className="p-4 border-b border-gray-200">
                <Text className="font-semibold text-lg">Location</Text>
            </View>
            <View style={{ height: 192 }}>
                <MapLibreGL.MapView
                    style={StyleSheet.absoluteFillObject}
                    mapStyle={STYLE_URL}
                    scrollEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    zoomEnabled={false}
                    attributionEnabled={false}
                    logoEnabled={false}
                >
                    <MapLibreGL.Camera
                        defaultSettings={{
                            centerCoordinate: coordinates,
                            zoomLevel: MINIMAP_ZOOM,
                        }}
                    />

                    <MapLibreGL.PointAnnotation
                        id={`marker-${runestone.id}`}
                        coordinate={coordinates}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerCircle} />
                        </View>
                    </MapLibreGL.PointAnnotation>
                </MapLibreGL.MapView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: MARKER_COLOR,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
});
