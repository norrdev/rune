import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Runestone } from '../types';

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

    const region = {
        latitude: runestone.latitude,
        longitude: runestone.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    return (
        <View className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <View className="p-4 border-b border-gray-200">
                <Text className="font-semibold text-blue-700 text-lg">Location</Text>
            </View>
            <View style={{ height: 192 }}>
                <MapView
                    style={StyleSheet.absoluteFillObject}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={region}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                >
                    <Marker
                        coordinate={{ latitude: runestone.latitude, longitude: runestone.longitude }}
                        pinColor="red"
                    />
                </MapView>
            </View>
        </View>
    );
};
