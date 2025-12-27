import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import type { Runestone } from '../../src/types';
import { runestonesCache } from '../../src/services/runestonesCache';
import { RunestonePage } from '../../src/components/RunestonePage';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';

export default function RunestoneDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [runestone, setRunestone] = useState<Runestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRunestone = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await runestonesCache.getRunestoneBySlug(slug);
        setRunestone(data);

        if (!data) {
          setError('Runestone not found');
        }
      } catch (err) {
        console.error('Error fetching runestone:', err);
        setError('Failed to load runestone');
      } finally {
        setLoading(false);
      }
    };

    fetchRunestone();
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading runestone...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-red-600 text-4xl mb-4">⚠️</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">Runestone Not Found</Text>
        <Text className="text-gray-600 mb-6 text-center">{error}</Text>
        <Link href="/" asChild>
          <Pressable className="bg-blue-600 px-6 py-2 rounded-lg">
            <Text className="text-white font-medium">← Back to Map</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return <RunestonePage runestone={runestone} />;
}
