import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { searchStore } from '../../../stores/searchStore';

interface SearchWidgetProps {
  onClose?: () => void;
}

export const SearchWidget = observer(({ onClose }: SearchWidgetProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    searchStore.performSearch(searchQuery);
  };

  const handleInputChange = (text: string) => {
    setSearchQuery(text);

    // Perform search as user types
    if (text.trim()) {
      searchStore.performSearch(text);
    } else {
      searchStore.clearSearch();
    }
  };

  return (
    <View className="p-4">
      <View className="relative">
        <TextInput
          placeholder="Search runestones..."
          value={searchQuery}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSearch}
          className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded"
        />
        <Pressable
          onPress={handleSearch}
          disabled={searchStore.isLoading}
          className={`absolute right-2 top-0 bottom-0 justify-center p-1 ${searchStore.isLoading ? 'opacity-50' : ''}`}
        >
          {searchStore.isLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className="text-primary">Search</Text>
          )}
        </Pressable>
      </View>

      {/* Search Results */}
      {searchStore.hasSearched && (
        <View className="mt-4">
          {searchStore.isLoading ? (
            <Text className="text-sm text-gray-500 text-center py-2">Searching...</Text>
          ) : searchStore.hasResults ? (
            <View className="gap-2">
              <Text className="text-sm text-gray-600">
                Found {searchStore.resultCount} result{searchStore.resultCount !== 1 ? 's' : ''}
              </Text>
              <ScrollView className="max-h-64" showsVerticalScrollIndicator={true}>
                {searchStore.searchResults.slice(0, 10).map((runestone) => (
                  <Pressable
                    key={runestone.id}
                    className="p-2 bg-gray-50 rounded mb-1 active:bg-gray-100"
                    onPress={() => {
                      // On native, close the sidebar before showing the modal
                      if (Platform.OS !== 'web' && onClose) {
                        onClose();
                      }
                      searchStore.setSelectedRunestone(runestone);
                    }}
                  >
                    <Text className="font-medium text-sm">{runestone.signature_text}</Text>
                    <Text className="text-xs text-gray-500">
                      {runestone.found_location}, {runestone.parish}
                    </Text>
                  </Pressable>
                ))}
                {searchStore.resultCount > 10 && (
                  <Text className="text-xs text-gray-500 text-center py-1">
                    Showing first 10 of {searchStore.resultCount} results
                  </Text>
                )}
              </ScrollView>
            </View>
          ) : (
            <Text className="text-sm text-gray-500 text-center py-2">No runestones found</Text>
          )}
        </View>
      )}
    </View>
  );
});
