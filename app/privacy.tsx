import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';

export default function Privacy() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <PageHeader title="Privacy Policy" />

      <View className="md:p-8 lg:p-12">
        <View className="md:max-w-5xl md:mx-auto w-full bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-100 overflow-hidden">

          <View className="p-4 md:p-8">
            <Text className="text-3xl font-bold text-primary mb-6">Privacy Policy</Text>

            <View className="space-y-6">
              <Text className="text-base text-gray-700 mb-4 leading-6">
                At Runestone Safari, we take your privacy seriously. This policy describes how we collect, use, and
                protect your personal information.
              </Text>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">Information We Collect</Text>
              <View className="mb-4 ml-4">
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">Account information (email, password) when you create an account</Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">Usage data to improve our services</Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">Location data when you use the map features</Text>
                </View>
              </View>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">How We Use Your Information</Text>
              <View className="mb-4 ml-4">
                {[
                  'To provide and maintain our service',
                  'To notify you about changes to our service',
                  'To provide customer support',
                  'To gather analysis or valuable information to improve our service',
                  'To monitor the usage of our service',
                  'To detect, prevent and address technical issues'
                ].map((item, index) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="flex-1 text-gray-700">{item}</Text>
                  </View>
                ))}
              </View>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">Data Storage and Security</Text>
              <Text className="text-base text-gray-700 mb-4 leading-6">
                We use Supabase for secure data storage and authentication. Your data is protected using
                industry-standard security measures.
              </Text>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">Third-Party Services</Text>
              <Text className="text-base text-gray-700 mb-4 leading-6">We use the following third-party services:</Text>
              <View className="mb-4 ml-4">
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">Supabase for database and authentication</Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">Cloudflare for hosting and security</Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">OpenFreeMap for map tiles</Text>
                </View>
              </View>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">Your Rights</Text>
              <Text className="text-base text-gray-700 mb-4 leading-6">You have the right to:</Text>
              <View className="mb-4 ml-4">
                {[
                  'Access your personal data',
                  'Correct inaccurate data',
                  'Request deletion of your data',
                  'Object to processing of your data',
                  'Request restriction of processing your data',
                  'Request transfer of your data',
                  'Withdraw consent'
                ].map((item, index) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="flex-1 text-gray-700">{item}</Text>
                  </View>
                ))}
              </View>

              <Text className="text-xl font-semibold text-primary mt-8 mb-4">Contact Us</Text>
              <Text className="text-base text-gray-700 mb-4 leading-6">
                If you have any questions about this Privacy Policy, please contact us at:
              </Text>
              <TouchableOpacity onPress={() => {/* Handle mailto */ }}>
                <Text className="text-primary underline">
                  privacy.runestonesafari.1atjf@simplelogin.com
                </Text>
              </TouchableOpacity>

              <Text className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</Text>
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}
