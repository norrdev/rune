import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  DEFAULT_ZOOM_NATIVE,
  SEARCH_ZOOM_NATIVE,
  CAMERA_ANIMATION_DURATION_NATIVE,
  CLUSTER_RADIUS,
  CLUSTER_MAX_ZOOM,
  LAYER_IDS,
  RUNESTONES_SOURCE_ID,
  LOADING_INDICATOR_COLOR,
  UNVISITED_MARKER_COLOR,
  VISITED_MARKER_COLOR,
  MARKER_RADIUS_NATIVE,
  MARKER_STROKE_WIDTH_NATIVE,
  MARKER_STROKE_COLOR,
  CLUSTER_COUNT_TEXT_SIZE,
  CLUSTER_COUNT_TEXT_COLOR,
  CLUSTER_COUNT_FONT_NATIVE,
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
  const insets = useSafeAreaInsets();

  // Initial center (Stockholm area - Jarlabanke bridge)
  const [center] = useState<[number, number]>(JARLABANKE_BRIDGE);
  const [zoom] = useState(DEFAULT_ZOOM_NATIVE);
  const [isLocating, setIsLocating] = useState(false);

  const loadRunestones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await runestonesCache.getAllRunestones();

      // Apply visited status from store
      const dataWithVisited = visitedRunestonesStore.applyVisitedStatus(data);

      runestonesRef.current = dataWithVisited;
      setRunestones(dataWithVisited);

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

  const refreshVisitedStatus = useCallback(() => {
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
    // Update runestones with new visited status
    const updatedRunestones = visitedRunestonesStore.applyVisitedStatus(runestonesRef.current);
    runestonesRef.current = updatedRunestones;
    setRunestones(updatedRunestones);
  }, [onVisitedCountChange]);

  // React to visited status changes (e.g. login/logout or manual marking)
  useEffect(() => {
    const dispose = reaction(
      () => visitedRunestonesStore.visitedCount,
      () => {
        refreshVisitedStatus();
      },
    );
    return () => dispose();
  }, [refreshVisitedStatus]);

  // Navigate to selected runestone from search
  useEffect(() => {
    const dispose = reaction(
      () => searchStore.selectedRunestone,
      (runestone) => {
        if (runestone && cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [runestone.longitude, runestone.latitude],
            zoomLevel: SEARCH_ZOOM_NATIVE,
            animationDuration: CAMERA_ANIMATION_DURATION_NATIVE,
          });

          setSelectedRunestone(runestone);
          setIsModalOpen(true);
          searchStore.setSelectedRunestone(null);
        }
      },
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
      const runestone = runestonesRef.current.find((stone) => stone.id === feature.properties?.id);
      if (runestone) {
        setSelectedRunestone(runestone);
        setIsModalOpen(true);
      }
    }
  }, []);

  const handleLocationPress = useCallback(async () => {
    try {
      setIsLocating(true);

      // Request location permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to center the map on your position.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
          setIsLocating(false);
          return;
        }
      }

      // Get user location from the UserLocation component
      const location = await MapLibreGL.locationManager.getLastKnownLocation();

      if (location && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 15,
          animationDuration: CAMERA_ANIMATION_DURATION_NATIVE,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location');
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleCompassPress = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        heading: 0,
        animationDuration: CAMERA_ANIMATION_DURATION_NATIVE,
      });
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
            id={RUNESTONES_SOURCE_ID}
            shape={geoJsonData}
            onPress={handleShapePress}
            cluster
            clusterRadius={CLUSTER_RADIUS}
            clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
          >
            {/* Cluster circles */}
            <MapLibreGL.CircleLayer
              id={LAYER_IDS.CLUSTERS}
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
              id={LAYER_IDS.CLUSTER_COUNT}
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: CLUSTER_COUNT_TEXT_SIZE,
                textColor: CLUSTER_COUNT_TEXT_COLOR,
                textFont: CLUSTER_COUNT_FONT_NATIVE,
              }}
            />

            {/* Unvisited runestones - red */}
            <MapLibreGL.CircleLayer
              id={LAYER_IDS.UNVISITED}
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], false]]}
              style={{
                circleRadius: MARKER_RADIUS_NATIVE,
                circleColor: UNVISITED_MARKER_COLOR,
                circleStrokeWidth: MARKER_STROKE_WIDTH_NATIVE,
                circleStrokeColor: MARKER_STROKE_COLOR,
              }}
            />

            {/* Visited runestones - green */}
            <MapLibreGL.CircleLayer
              id={LAYER_IDS.VISITED}
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'visited'], true]]}
              style={{
                circleRadius: MARKER_RADIUS_NATIVE,
                circleColor: VISITED_MARKER_COLOR,
                circleStrokeWidth: MARKER_STROKE_WIDTH_NATIVE,
                circleStrokeColor: MARKER_STROKE_COLOR,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LOADING_INDICATOR_COLOR} />
          <Text style={{ marginTop: 10 }}>Loading markers...</Text>
        </View>
      )}

      {/* Map Control Buttons */}
      <View style={[styles.controlButtons, { top: insets.top + 16, right: 16 }]}>
        {/* Location Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Text style={styles.controlButtonIcon}>📍</Text>
          )}
        </TouchableOpacity>

        {/* Compass Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCompassPress}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonIcon}>🧭</Text>
        </TouchableOpacity>
      </View>

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
  controlButtons: {
    position: 'absolute',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonIcon: {
    fontSize: 24,
  },
});
