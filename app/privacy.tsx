import { Text, ScrollView } from 'react-native'; 
import { Stack } from 'expo-router';

export default function Privacy() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView className="bg-white p-4">
        <Text className="text-xl font-bold text-primary mb-4">Privacy Policy</Text>
        <Text className="text-base text-gray-700">
          Privacy logic placeholder.
        </Text>
      </ScrollView>
    </>
  );
}
