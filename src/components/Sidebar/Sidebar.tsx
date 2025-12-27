import { observer } from 'mobx-react-lite';
import { View, Text, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthWidget } from './widgets/AuthWidget';
import { SearchWidget } from './widgets/SearchWidget';
import { authStore } from '../../stores/authStore';
import { Link } from 'expo-router';

// Cluster styling constants (matching MapComponent)
const CLUSTER_COLORS = {
  SMALL: '#8B4513', // Dark brown for clusters with < 100 points
  MEDIUM: '#A0522D', // Medium brown for clusters with 100-750 points
  LARGE: '#CD853F', // Light brown for clusters with > 750 points
} as const;

interface SidebarProps {
  visitedCount: number;
  visible?: boolean;
  onClose?: () => void;
}

export const Sidebar = observer(({ visitedCount, visible = false, onClose }: SidebarProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;

  // On mobile, if not visible, render nothing (or handle transition separately, simple toggle for now)
  if (isMobile && !visible) {
    return null;
  }

  // Adjust container classes based on mobile/desktop
  // For simplicity in this port, we'll use conditional rendering for the overlay and a fixed/absolute view for sidebar

  return (
    <>
      {/* Mobile overlay */}
      {visible && isMobile && (
        <Pressable
          className="absolute inset-0 bg-black/50 z-40"
          onPress={onClose}
        />
      )}

      <View
        className={`bg-white border-r border-gray-200 flex-1 flex-col z-50
          ${isMobile ? 'absolute top-0 left-0 h-full w-80' : 'w-64 max-w-sm h-full'}
        `}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <Pressable
            className="absolute z-60 bg-white rounded-full w-10 h-10 items-center justify-center shadow"
            style={{
              top: insets.top + 16,
              right: insets.right + 16,
            }}
            onPress={onClose}
          >
            <Text className="text-gray-600 font-bold text-lg">✕</Text>
          </Pressable>
        )}

        {/* All content except footer */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Header */}
          <View
            className="px-6 pb-6 border-b border-gray-200"
            style={{ paddingTop: isMobile ? insets.top + 24 : 24 }}
          >
            <Text className="text-xl font-bold text-primary">Runestone Safari</Text>
            <Text className="text-sm text-gray-600 mt-1">Explore Swedish runestones</Text>
          </View>

          {/* Search Widget */}
          <SearchWidget />

          {/* Visited Runestone Count */}
          {authStore.user && (
            <View className="p-4 border-t border-gray-200">
              <View className="items-center">
                <Link href="/profile" asChild>
                  <Pressable>
                    <Text className="text-sm text-gray-600">
                      <Text className="font-medium text-primary">{visitedCount}</Text> visited runestones
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          )}

          {/* Map Legend */}
          <View className="p-4 border-t border-gray-200">
            <Text className="text-xs font-medium text-gray-700 mb-3">Map Legend:</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS.SMALL }} />
                <Text className="text-xs text-gray-600">&lt; 100 stones</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS.MEDIUM }} />
                <Text className="text-xs text-gray-600">100-750 stones</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS.LARGE }} />
                <Text className="text-xs text-gray-600">&gt; 750 stones</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                <Text className="text-xs text-gray-600">Unvisited stone</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                <Text className="text-xs text-gray-600">Visited stone</Text>
              </View>
            </View>
          </View>

          {/* Auth Widget */}
          <AuthWidget />
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-200 bg-gray-50">
          <View className="flex-row flex-wrap justify-center gap-1">
            <Link href="/about"><Text className="text-xs text-gray-500 underline">About</Text></Link>
            <Text className="text-xs text-gray-500">•</Text>
            <Link href="/privacy"><Text className="text-xs text-gray-500 underline">Privacy Policy</Text></Link>
            <Text className="text-xs text-gray-500">•</Text>
            <Link href="/license"><Text className="text-xs text-gray-500 underline">License</Text></Link>
          </View>
          <Text className="text-xs text-gray-500 text-center mt-1">© 2025 Denis Filonov</Text>
        </View>
      </View>
    </>
  );
});
