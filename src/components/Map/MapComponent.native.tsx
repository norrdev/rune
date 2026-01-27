import { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { RunestoneModal } from '../Runestone/RunestoneModal';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import { mapStore } from '../../stores/mapStore';
import { observer } from 'mobx-react-lite';
import {
  STYLE_URL,
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
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const insets = useSafeAreaInsets();

  // Initialize map store for native platform and load runestones
  useEffect(() => {
    mapStore.setPlatform('native');
    mapStore.loadRunestones();
  }, []);

  // Notify parent of visited count changes
  const notifyVisitedCount = useCallback(() => {
    if (onVisitedCountChange) {
      onVisitedCountChange(visitedRunestonesStore.visitedCount);
    }
  }, [onVisitedCountChange]);

  useEffect(() => {
    notifyVisitedCount();
  }, [notifyVisitedCount]);

  // Sync camera with store (for programmatic navigation)
  useEffect(() => {
    if (cameraRef.current && mapStore.cameraUpdateTrigger > 0) {
      cameraRef.current.setCamera({
        centerCoordinate: mapStore.center,
        zoomLevel: mapStore.zoom,
        heading: mapStore.bearing,
        animationDuration: CAMERA_ANIMATION_DURATION_NATIVE,
      });
    }
  }, []);

  const handleShapePress = (event: MapLibreGL.OnPressEvent) => {
    const feature = event.features?.[0];
    if (feature?.properties?.id) {
      const runestone = mapStore.runestones.find((stone) => stone.id === feature.properties?.id);
      if (runestone) {
        mapStore.openModal(runestone);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={STYLE_URL}
        attributionEnabled={true}
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: mapStore.center,
            zoomLevel: mapStore.zoom,
          }}
        />

        <MapLibreGL.UserLocation visible={true} />

        {mapStore.hasRunestones && (
          <MapLibreGL.ShapeSource
            id={RUNESTONES_SOURCE_ID}
            shape={mapStore.geoJsonData}
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

      {mapStore.loading && (
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
          onPress={() => mapStore.getCurrentLocation()}
          activeOpacity={0.7}
        >
          {mapStore.isLocating ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Text style={styles.controlButtonIcon}>📍</Text>
          )}
        </TouchableOpacity>

        {/* Compass Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => mapStore.resetBearing()}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonIcon}>🧭</Text>
        </TouchableOpacity>
      </View>

      <RunestoneModal
        runestone={mapStore.selectedRunestone}
        isOpen={mapStore.isModalOpen}
        onClose={() => mapStore.closeModal()}
        onVisitedStatusChange={() => mapStore.refreshVisitedStatus()}
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
