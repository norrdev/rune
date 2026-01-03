import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import type { Runestone } from '../../../types';

interface RunestoneMediaProps {
  runestone: Runestone;
}

export const RunestoneMedia = ({ runestone }: RunestoneMediaProps) => {
  if (!runestone.direct_url) {
    return null;
  }

  return (
    <View>
      <Text className="font-semibold text-gray-700 mb-2">Media</Text>
      <View className="bg-gray-50 p-3 rounded">
        <Link href={runestone.link_url || ''} asChild target="_blank">
          <Pressable>
            <Image
              source={{ uri: runestone.direct_url }}
              className="w-full h-64 mb-2"
              resizeMode="contain"
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
};
