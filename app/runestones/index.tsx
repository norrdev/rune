import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function RunestonesIndex() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Stack.Screen options={{ title: 'Runestones' }} />
      <Text className="text-xl font-bold">Runestone List</Text>
      <Text className="text-gray-500 mt-2">Coming soon...</Text>
    </View>
  );
}
