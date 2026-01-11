import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <View
      className="bg-white shadow-sm border-t border-gray-200"
      style={{ paddingTop: insets.top }}
    >
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleBack}
            className="p-3 -ml-3 active:opacity-50"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-primary text-3xl font-light">‹</Text>
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900 flex-1">{title}</Text>
        </View>
      </View>
    </View>
  );
};
