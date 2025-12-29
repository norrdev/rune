import React, { useState, useEffect, useRef } from 'react';

import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { runestonesCache } from '../services/runestonesCache'; // Resolves to .native.ts
import type { Runestone } from '../types';
import { RunestoneModal } from './RunestoneModal';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { searchStore } from '../stores/searchStore';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

interface MapComponentProps {
  onVisitedCountChange?: (count: number) => void;
}

export const MapComponent = observer(({ onVisitedCountChange }: MapComponentProps) => {
  const [runestones, setRunestones] = useState<Runestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunestone, setSelectedRunestone] = useState<Runestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Initial Region (Stockholm)
  const [region, setRegion] = useState<Region>({
    latitude: 59.4293,
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const loadRunestones = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await runestonesCache.getAllRunestones();

      // Filter for performance initially? 
      // For 6000 items, basic Markers might be slow without clustering.
      // But we'll try to render them and see.
      setRunestones(data);

      // Update store with initial count
      if (onVisitedCountChange) {
        onVisitedCountChange(visitedRunestonesStore.visitedCount);
      }
    } catch (error) {
      console.error('Failed to load runestones:', error);
      Alert.alert('Error', 'Failed to load runestones');
    } finally {
      setLoading(false);
    }
  }, [onVisitedCountChange]);

  useEffect(() => {
    loadRunestones();
  }, [loadRunestones]);

  const handleMarkerPress = (runestone: Runestone) => {
    setSelectedRunestone(runestone);
    setIsModalOpen(true);
  };

  const refreshVisitedStatus = () => {
    // Trigger re-render if needed, but MobX observer should handle store updates
    // We might need to refresh the local runestones list if we were filtering
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
  };

  // Navigate to selected runestone from search
  useEffect(() => {
    const dispose = reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone && mapRef.current) {
          // Animate to the runestone's location
          mapRef.current.animateToRegion({
            latitude: runestone.latitude,
            longitude: runestone.longitude,
            latitudeDelta: 0.01, // Close zoom
            longitudeDelta: 0.01,
          }, 1000); // 1 second animation

          // Open the modal for the selected runestone
          setSelectedRunestone(runestone);
          setIsModalOpen(true);

          // Clear selected runestone after navigation
          searchStore.setSelectedRunestone(null);
        }
      }
    );

    return () => dispose();
  }, []);

  // Optimization: Only render markers within current region?
  // Or just render all if < 1000. 
  // With 6000, we definitely need clustering or limiting.
  // For now, let's limit to top 100 visible or something simple to prove it works.

  const visibleRunestones = runestones.filter(stone => {
    const latDiff = Math.abs(stone.latitude - region.latitude);
    const lonDiff = Math.abs(stone.longitude - region.longitude);
    return latDiff < region.latitudeDelta / 2 + 0.05 && lonDiff < region.longitudeDelta / 2 + 0.05;
  }).slice(0, 50); // Hard limit for safety in Expo Go initially

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT} // Uses Apple Maps on iOS, Google on Android
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {visibleRunestones.map((stone) => {
          const isVisited = visitedRunestonesStore.isVisited(stone.id);
          return (
            <Marker
              key={stone.id}
              coordinate={{ latitude: stone.latitude, longitude: stone.longitude }}
              onPress={() => handleMarkerPress(stone)}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.markerCircle,
                  { backgroundColor: isVisited ? '#22c55e' : '#ef4444' }
                ]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#866c53" />
          <Text style={{ marginTop: 10 }}>Loading markers...</Text>
        </View>
      )}

      {/* Re-use the modal we ported! */}
      <RunestoneModal
        runestone={selectedRunestone}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVisitedStatusChange={refreshVisitedStatus}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center'
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  }
});
