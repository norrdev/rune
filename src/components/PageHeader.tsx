import { Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <View className="bg-white shadow-sm border-b border-gray-200">
      <View className="max-w-4xl mx-auto px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Link href="/" asChild>
              <Pressable>
                <Text className="text-primary text-sm mb-2">
                  ← Back to Map
                </Text>
              </Pressable>
            </Link><Text className="text-2xl font-bold text-primary">{title}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
