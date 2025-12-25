import { Text, ScrollView } from 'react-native'; 
import { Stack } from 'expo-router';

export default function License() {
  return (
    <>
      <Stack.Screen options={{ title: 'License' }} />
      <ScrollView className="bg-white p-4">
        <Text className="text-xl font-bold text-primary mb-4">License</Text>
        <Text className="text-base text-gray-700">
          GPL-3.0-or-later
        </Text>
      </ScrollView>
    </>
  );
}
