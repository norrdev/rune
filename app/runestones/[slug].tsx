import { View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function RunestoneDetail() {
  const { slug } = useLocalSearchParams();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Stack.Screen options={{ title: 'Runestone Details' }} />
      <Text className="text-xl font-bold">Runestone: {slug}</Text>
      <Text className="text-gray-500 mt-2">Coming soon...</Text>
    </View>
  );
}
