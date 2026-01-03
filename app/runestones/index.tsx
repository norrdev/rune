import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { PageHeader } from '../../src/components/PageHeader';
import { runestonesCache } from '../../src/services/Cache/runestonesCache';
import type { Runestone } from '../../src/types';

export default function Runestones() {
  const [runestones, setRunestones] = useState<Runestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRunestones = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await runestonesCache.getAllRunestones();
        setRunestones(data);
      } catch (err) {
        console.error('Error fetching runestones:', err);
        setError('Failed to load runestones');
      } finally {
        setLoading(false);
      }
    };

    fetchRunestones();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading runestones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-red-600 text-4xl mb-4">⚠️</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">Error Loading Runestones</Text>
        <Text className="text-gray-600 mb-6 text-center">{error}</Text>
        <Link href="/" asChild>
          <Pressable className="bg-blue-600 px-6 py-2 rounded-lg">
            <Text className="text-white font-medium">← Back to Map</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const visitedCount = runestones.filter((r) => r.visited).length;
  const unvisitedCount = runestones.length - visitedCount;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <PageHeader title="All Runestones" />

      <View className="py-12 px-4 max-w-6xl mx-auto w-full">
        <View className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <View className="p-6 md:p-8">
            <View className="mb-6">
              <Text className="text-xl font-semibold text-blue-900 mb-2">
                {runestones.length.toLocaleString()} Runestones Found
              </Text>
              <Text className="text-gray-600 leading-relaxed">
                Explore all runestones in our database. Click on any runestone to view its details.
              </Text>
            </View>

            {/* Tag Cloud */}
            <View className="flex-row flex-wrap gap-3 justify-center">
              {runestones.map((runestone) => (
                <Link
                  key={runestone.id}
                  href={`/runestones/${runestone.slug}`}
                  asChild
                >
                  <Pressable className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 active:bg-blue-100">
                    <Text className="text-blue-800 text-sm font-medium">
                      {runestone.signature_text || `Runestone ${runestone.id}`}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>

            {/* Statistics */}
            <View className="mt-8 pt-6 border-t border-gray-200">
              <View className="flex-row flex-wrap gap-4 justify-between">
                <View className="bg-gray-50 rounded-lg p-4 flex-1 min-w-[120px] items-center">
                  <Text className="text-2xl font-bold text-blue-900">{runestones.length.toLocaleString()}</Text>
                  <Text className="text-xs text-gray-600 uppercase tracking-wider mt-1">Total</Text>
                </View>
                <View className="bg-gray-50 rounded-lg p-4 flex-1 min-w-[120px] items-center">
                  <Text className="text-2xl font-bold text-green-600">{visitedCount.toLocaleString()}</Text>
                  <Text className="text-xs text-gray-600 uppercase tracking-wider mt-1">Visited</Text>
                </View>
                <View className="bg-gray-50 rounded-lg p-4 flex-1 min-w-[120px] items-center">
                  <Text className="text-2xl font-bold text-orange-600">{unvisitedCount.toLocaleString()}</Text>
                  <Text className="text-xs text-gray-600 uppercase tracking-wider mt-1">Unvisited</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="bg-gray-50 px-6 py-4 flex-row items-center justify-between border-t border-gray-200">
            <Text className="text-sm text-gray-500">Showing all runestones</Text>
            <Link href="/" asChild>
              <Pressable className="bg-blue-600 px-4 py-2 rounded-md">
                <Text className="text-white text-sm font-medium">← Back to Map</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
