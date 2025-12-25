import { Text, ScrollView } from 'react-native'; 
import { Stack } from 'expo-router';

export default function About() {
  return (
    <>
      <Stack.Screen options={{ title: 'About' }} />
      <ScrollView className="bg-white p-4">
        <Text className="text-xl font-bold text-primary mb-4">About Runestone Safari</Text>
        <Text className="text-base text-gray-700">
          Explore over 6,800 Swedish runestones on an interactive map. Discover Viking Age history, translations, and locations of ancient Norse monuments across Sweden.
        </Text>
        <Text className="text-base text-gray-700 mt-4">
          (Content migrated from README.md)
        </Text>
      </ScrollView>
    </>
  );
}
