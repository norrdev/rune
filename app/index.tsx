import { useState } from 'react';
import { View, Pressable, Text, useWindowDimensions } from 'react-native';
import { MapComponent } from '../src/components/MapComponent';
import { Sidebar } from '../src/components/Sidebar/Sidebar';

export default function Page() {
  const [visitedCount, setVisitedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1 flex-row bg-gray-50">
      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <Pressable
          className="absolute top-4 left-4 z-30 bg-white border border-gray-300 rounded p-2 shadow"
          onPress={() => setSidebarOpen(true)}
        >
          <Text className="text-black font-bold text-lg">☰</Text>
        </Pressable>
      )}

      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && (
        <Sidebar
          visitedCount={visitedCount}
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content (Map) */}
      <View className="flex-1 relative">
        <MapComponent onVisitedCountChange={setVisitedCount} />
      </View>
    </View>
  );
}
