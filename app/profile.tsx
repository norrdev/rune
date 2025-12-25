import { Text, View } from 'react-native'; 
import { Stack } from 'expo-router';

export default function Profile() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Stack.Screen options={{ title: 'Profile' }} />
      <Text className="text-xl font-bold">User Profile</Text>
      <Text className="text-gray-500 mt-2">Coming soon...</Text>
    </View>
  );
}
