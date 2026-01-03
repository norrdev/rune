import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { runestonesCache } from '@services/Cache/runestonesCache';
import type { Runestone } from '../../types';
import { RunestoneModal } from '../Runestone/RunestoneModal';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import { searchStore } from '../../stores/searchStore';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import {
  JARLABANKE_BRIDGE,
  STYLE_URL,
  createGeoJSONData,
} from './mapUtils';

// Initialize MapLibre
MapLibreGL.setAccessToken(null);

interface MapComponentProps {
  onVisitedCountChange?: (count: number) => void;
}

export const MapComponent = observer(({ onVisitedCountChange }: MapComponentProps) => {
  const [runestones, setRunestones] = useState<Runestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunestone, setSelectedRunestone] = useState<Runestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const runestonesRef = useRef<Runestone[]>([]);

  // Initial center (Stockholm area - Jarlabanke bridge)
  const [center] = useState<[number, number]>(JARLABANKE_BRIDGE);
  const [zoom] = useState(10);



  const loadRunestones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await runestonesCache.getAllRunestones();
      runestonesRef.current = data;
      setRunestones(data);

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

  const refreshVisitedStatus = () => {
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
    // Force re-render by updating state
    setRunestones([...runestonesRef.current]);
  };

  // Navigate to selected runestone from search
  useEffect(() => {
    const dispose = reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone && cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [runestone.longitude, runestone.latitude],
            zoomLevel: 14,
            animationDuration: 1000,
          });

          setSelectedRunestone(runestone);
          setIsModalOpen(true);
          searchStore.setSelectedRunestone(null);
        }
      }
    );

    return () => dispose();
  }, []);

  // Create GeoJSON for ShapeSource with all runestones (clustering handles performance)
  const geoJsonData = useMemo(() => {
    return createGeoJSONData(runestones);
  }, [runestones]);

  const handleRegionChange = useCallback(() => {
    // Region change handler - can be used for analytics if needed
  }, []);

  const handleShapePress = useCallback((event: MapLibreGL.OnPressEvent) => {
    const feature = event.features?.[0];
    if (feature?.properties?.id) {
      const runestone = runestonesRef.current.find(
        (stone) => stone.id === feature.properties?.id
      );
      if (runestone) {
        setSelectedRunestone(runestone);
        setIsModalOpen(true);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={STYLE_URL}
        onRegionDidChange={handleRegionChange}
        attributionEnabled={true}
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
        />

        <MapLibreGL.UserLocation visible={true} />

        {runestones.length > 0 && (
          <MapLibreGL.ShapeSource
            id="runestones"
            shape={geoJsonData}
            onPress={handleShapePress}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={13}
          >
            {/* Cluster circles */}
            <MapLibreGL.CircleLayer
              id="clusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: [
                  'step',
                  ['get', 'point_count'],
                  '#8B4513', // Small clusters
                  100,
                  '#A0522D', // Medium clusters
                  750,
                  '#CD853F', // Large clusters
                ],
                circleRadius: [
                  'step',
                  ['get', 'point_count'],
                  20, // Small clusters
                  100,
                  30, // Medium clusters
                  750,
                  40, // Large clusters
                ],
              }}
            />

            {/* Cluster count labels */}
            <MapLibreGL.SymbolLayer
              id="cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: 12,
                textColor: '#ffffff',
                textFont: ['Noto Sans Regular'],
              }}
            />

            {/* Unvisited runestones - red */}
            <MapLibreGL.CircleLayer
              id="unvisited-runestones"
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], false]]}
              style={{
                circleRadius: 8,
                circleColor: '#ef4444',
                circleStrokeWidth: 2,
                circleStrokeColor: '#ffffff',
              }}
            />

            {/* Visited runestones - green */}
            <MapLibreGL.CircleLayer
              id="visited-runestones"
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], true]]}
              style={{
                circleRadius: 8,
                circleColor: '#22c55e',
                circleStrokeWidth: 2,
                circleStrokeColor: '#ffffff',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#866c53" />
          <Text style={{ marginTop: 10 }}>Loading markers...</Text>
        </View>
      )}

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
    alignItems: 'center',
  },
});
