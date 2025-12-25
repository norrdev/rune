import { Runestone } from '../types';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { Link } from 'expo-router';

interface RunestoneModalProps {
  runestone: Runestone | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitedStatusChange?: () => void;
}

export const RunestoneModal = observer(({ runestone, isOpen, onClose, onVisitedStatusChange }: RunestoneModalProps) => {
  const [visitedError, setVisitedError] = useState<string | null>(null);

  const isVisited = runestone ? visitedRunestonesStore.isRunestoneVisited(runestone.id) : false;
  const loading = visitedRunestonesStore.loading;

  if (!runestone) {
    return null;
  }

  const handleMarkAsVisited = async () => {
    if (!runestone) return;
    setVisitedError(null);

    try {
      if (isVisited) {
        await visitedRunestonesStore.unmarkAsVisited(runestone.id);
      } else {
        await visitedRunestonesStore.markAsVisited(runestone.id);
      }
      if (onVisitedStatusChange) {
        onVisitedStatusChange();
      }
    } catch (error) {
      console.error('Error updating visited status:', error);
      setVisitedError('Failed to update visited status. Please try again.');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90%] overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <View className="flex-1 flex-row items-center gap-3">
              <Text className="text-xl font-bold text-gray-800 flex-shrink">{runestone.signature_text}</Text>
              <Link href={`/runestones/${runestone.slug}`} asChild>
                  <Pressable onPress={onClose}>
                    <Text className="text-primary text-sm font-medium">View Full Page</Text>
                  </Pressable>
              </Link>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-gray-400 text-2xl font-bold">×</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="gap-4">
              {/* Location */}
              <View>
                <Text className="font-semibold text-gray-700 mb-2">Location</Text>
                <View className="bg-gray-50 p-3 rounded">
                  <Text className="text-gray-800">{runestone.found_location}</Text>
                  <Text className="text-sm text-gray-600">{runestone.parish}</Text>
                  {runestone.district && <Text className="text-sm text-gray-600">{runestone.district}</Text>}
                  {runestone.municipality && <Text className="text-sm text-gray-600">{runestone.municipality}</Text>}
                  {runestone.current_location && (
                    <Text className="text-sm text-gray-600">Current: {runestone.current_location}</Text>
                  )}
                  {runestone.latitude && runestone.longitude && (
                    <Text className="text-sm text-gray-600">
                      {runestone.latitude}, {runestone.longitude}
                    </Text>
                  )}
                </View>
              </View>

              {/* Basic Details */}
              <View>
                <Text className="font-semibold text-gray-700 mb-2">Details</Text>
                <View className="bg-gray-50 p-3 rounded gap-1">
                  <Text className="text-sm"><Text className="font-medium">Material:</Text> {runestone.material || 'Unknown'}</Text>
                  <Text className="text-sm"><Text className="font-medium">Dating:</Text> {runestone.dating || 'Unknown'}</Text>
                  <Text className="text-sm"><Text className="font-medium">Type:</Text> {runestone.rune_type || 'Unknown'}</Text>
                  <Text className="text-sm"><Text className="font-medium">Style:</Text> {runestone.material_type || 'Unknown'}</Text>
                  {runestone.carver && <Text className="text-sm"><Text className="font-medium">Carver:</Text> {runestone.carver}</Text>}
                  {runestone.style && <Text className="text-sm"><Text className="font-medium">Style:</Text> {runestone.style}</Text>}
                </View>
              </View>

              {/* Status */}
              <View>
                <Text className="font-semibold text-gray-700 mb-2">Status</Text>
                <View className="bg-gray-50 p-3 rounded gap-1">
                  <Text className="text-sm"><Text className="font-medium">Lost:</Text> {runestone.lost ? 'Yes' : 'No'}</Text>
                  <Text className="text-sm"><Text className="font-medium">Ornamental:</Text> {runestone.ornamental ? 'Yes' : 'No'}</Text>
                  <Text className="text-sm"><Text className="font-medium">Recent:</Text> {runestone.recent ? 'Yes' : 'No'}</Text>
                </View>
              </View>

              {/* Translations */}
              {runestone.english_translation && (
                <View>
                  <Text className="font-semibold text-gray-700 mb-2">English Translation</Text>
                  <View className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <Text className="text-gray-800 text-sm leading-relaxed">{runestone.english_translation}</Text>
                  </View>
                </View>
              )}
               {runestone.swedish_translation && (
                <View>
                  <Text className="font-semibold text-gray-700 mb-2">Swedish Translation</Text>
                  <View className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                     <Text className="text-gray-800 text-sm leading-relaxed">{runestone.swedish_translation}</Text>
                  </View>
                </View>
              )}
               {runestone.norse_text && (
                <View>
                  <Text className="font-semibold text-gray-700 mb-2">Norse Text</Text>
                  <View className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                     <Text className="text-gray-800 text-sm leading-relaxed italic font-medium">{runestone.norse_text}</Text>
                  </View>
                </View>
              )}
               {runestone.transliteration && (
                <View>
                  <Text className="font-semibold text-gray-700 mb-2">Transliteration</Text>
                  <View className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                     <Text className="text-gray-800 text-sm leading-relaxed font-mono">{runestone.transliteration}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Error Message */}
          {authStore.user && visitedError && (
             <View className="px-4 pb-2">
                 <Text className="text-sm text-red-600 bg-red-50 p-2 rounded">{visitedError}</Text>
             </View>
          )}

          {/* Footer */}
          <View className="flex-row justify-between items-center p-4 border-t border-gray-200">
            {authStore.user && (
              <Pressable
                onPress={handleMarkAsVisited}
                disabled={loading}
                 className={`px-4 py-2 rounded flex-row items-center gap-2 ${
                  isVisited ? 'bg-red-600' : 'bg-green-600'
                } ${loading ? 'opacity-50' : ''}`}
              >
                  {loading && <ActivityIndicator size="small" color="white" />}
                  <Text className="text-white font-medium">
                      {loading ? 'Processing...' : isVisited ? 'Unmark as Visited' : 'Mark as Visited'}
                  </Text>
              </Pressable>
            )}

            <Pressable onPress={onClose} className="px-4 py-2 bg-gray-500 rounded">
              <Text className="text-white font-medium">Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});
