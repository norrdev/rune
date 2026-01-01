import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { Runestone } from '../types';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { PageHeader } from './PageHeader';
import { MiniMap } from './MiniMap';

interface RunestonePageProps {
  runestone: Runestone | null;
  onVisitedStatusChange?: () => void;
}

export const RunestonePage = observer(({ runestone, onVisitedStatusChange }: RunestonePageProps) => {
  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  const [visitedError, setVisitedError] = useState<string | null>(null);

  const isVisited = runestone ? visitedRunestonesStore.isRunestoneVisited(runestone.id) : false;

  // If no runestone, show loading
  if (!runestone) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <View className="items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4">Loading runestone...</Text>
        </View>
      </View>
    );
  }

  const handleMarkAsVisited = async () => {
    if (!runestone) return;

    setIsMarkingVisited(true);
    setVisitedError(null);

    try {
      if (isVisited) {
        // Unmark as visited
        await visitedRunestonesStore.unmarkAsVisited(runestone.id);
        console.log('Runestone unmarked as visited!');
      } else {
        // Mark as visited
        await visitedRunestonesStore.markAsVisited(runestone.id);
        console.log('Runestone marked as visited!');
      }

      // Notify parent component to refresh map data (if callback provided)
      if (onVisitedStatusChange) {
        onVisitedStatusChange();
      }
    } catch (error) {
      console.error('Error updating visited status:', error);
      setVisitedError('Failed to update visited status. Please try again.');
    } finally {
      setIsMarkingVisited(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <PageHeader title={runestone.signature_text || `Runestone ${runestone.id}`} />

      {/* Content */}
      <View className="px-4 py-4 md:py-8 md:max-w-4xl md:mx-auto w-full">
        <View className="gap-6">
          {/* Mini Map */}
          <MiniMap runestone={runestone} />

          <View className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Content */}
            <View className="p-6">
              <View className="gap-6">
                {/* Location Details */}
                <View>
                  <Text className="font-semibold  mb-3 text-lg">Location Details</Text>
                  <View className="bg-gray-50 p-4 rounded-lg">
                    <Text className="text-gray-800 font-medium">{runestone.found_location}</Text><Text className="text-sm text-gray-600">{runestone.parish}</Text>{!!runestone.district && <Text className="text-sm text-gray-600">{runestone.district}</Text>}{!!runestone.municipality && <Text className="text-sm text-gray-600">{runestone.municipality}</Text>}{!!runestone.current_location && (
                      <Text className="text-sm text-gray-600">Current: {runestone.current_location}</Text>
                    )}{runestone.latitude !== null && runestone.longitude !== null && (
                      <Text className="text-sm text-gray-600">
                        {runestone.latitude}, {runestone.longitude}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Visit Status */}
                {authStore.user && (
                  <View>
                    <Text className="font-semibold mb-3 text-lg">Visit Status</Text>
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          {visitedRunestonesStore.loading ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                          ) : (
                            <View
                              className={`w-5 h-5 rounded-full border-2 ${isVisited ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'
                                }`}
                            />
                          )}<Text className="text-sm font-medium text-gray-700">
                            {isVisited ? 'Visited' : 'Not visited'}
                          </Text>
                        </View>
                        <Pressable
                          onPress={handleMarkAsVisited}
                          disabled={isMarkingVisited || visitedRunestonesStore.loading}
                          className={`px-4 py-2 rounded-md ${isVisited
                            ? 'bg-red-100'
                            : 'bg-green-100'
                            } ${isMarkingVisited || visitedRunestonesStore.loading ? 'opacity-50' : ''}`}
                        >
                          {isMarkingVisited ? (
                            <View className="flex-row items-center gap-2">
                              <ActivityIndicator size="small" color="currentColor" />
                              <Text className={isVisited ? 'text-red-700' : 'text-green-700'}>Updating...</Text>
                            </View>
                          ) : (
                            <Text className={`text-sm font-medium ${isVisited ? 'text-red-700' : 'text-green-700'}`}>
                              {isVisited ? 'Mark as not visited' : 'Mark as visited'}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                      {!!visitedError && <Text className="text-red-600 text-sm mt-2">{visitedError}</Text>}
                    </View>
                  </View>
                )}

                {/* Basic Details */}
                <View>
                  <Text className="font-semibold mb-3 text-lg">Details</Text>
                  <View className="bg-gray-50 p-4 rounded-lg gap-2">
                    <Text className="text-sm">
                      <Text className="font-medium">Material:</Text> {runestone.material || 'Unknown'}
                    </Text><Text className="text-sm">
                      <Text className="font-medium">Dating:</Text> {runestone.dating || 'Unknown'}
                    </Text><Text className="text-sm">
                      <Text className="font-medium">Type:</Text> {runestone.rune_type || 'Unknown'}
                    </Text><Text className="text-sm">
                      <Text className="font-medium">Style:</Text> {runestone.material_type || 'Unknown'}
                    </Text>{!!runestone.carver && (
                      <Text className="text-sm">
                        <Text className="font-medium">Carver:</Text> {runestone.carver}
                      </Text>
                    )}{!!runestone.style && (
                      <Text className="text-sm">
                        <Text className="font-medium">Style:</Text> {runestone.style}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Status */}
                <View>
                  <Text className="font-semibold mb-3 text-lg">Status</Text>
                  <View className="bg-gray-50 p-4 rounded-lg gap-2">
                    <Text className="text-sm">
                      <Text className="font-medium">Lost:</Text> {runestone.lost ? 'Yes' : 'No'}
                    </Text><Text className="text-sm">
                      <Text className="font-medium">Ornamental:</Text> {runestone.ornamental ? 'Yes' : 'No'}
                    </Text><Text className="text-sm">
                      <Text className="font-medium">Recent:</Text> {runestone.recent ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>

                {/* Text Content */}
                {!!runestone.norse_text && (
                  <View>
                    <Text className="font-semibold mb-3 text-lg">Norse Text</Text>
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <Text className="text-gray-800 font-mono text-sm">{runestone.norse_text}</Text>
                    </View>
                  </View>
                )}

                {!!runestone.transliteration && (
                  <View>
                    <Text className="font-semibold mb-3 text-lg">Transliteration</Text>
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <Text className="text-gray-800 font-mono text-sm">{runestone.transliteration}</Text>
                    </View>
                  </View>
                )}

                {!!runestone.swedish_translation && (
                  <View>
                    <Text className="font-semibold mb-3 text-lg">Swedish Translation</Text>
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <Text className="text-gray-800">{runestone.swedish_translation}</Text>
                    </View>
                  </View>
                )}

                {!!runestone.english_translation && (
                  <View>
                    <Text className="font-semibold mb-3 text-lg">English Translation</Text>
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <Text className="text-gray-800">{runestone.english_translation}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
});
