import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, Link, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { authStore } from '../src/stores/authStore';
import { visitedRunestonesStore } from '../src/stores/visitedRunestonesStore';
import { Runestone } from '../src/types';
import { PageHeader } from '../src/components/PageHeader';

export default observer(function Profile() {
  const router = useRouter();
  const [visitedRunestoneDetails, setVisitedRunestoneDetails] = useState<Runestone[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const loadVisitedRunestoneDetails = async () => {
      if (!authStore.isFullyAuthenticated || visitedRunestonesStore.loading) {
        return;
      }

      if (visitedRunestonesStore.visitedCount === 0) {
        setVisitedRunestoneDetails([]);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const details = await visitedRunestonesStore.getVisitedRunestoneDetails();
        setVisitedRunestoneDetails(details);
      } catch (err) {
        console.error('Error loading visited runestone details:', err);
        setDetailsError('Failed to load runestone details. Please try again.');
      } finally {
        setDetailsLoading(false);
      }
    };

    loadVisitedRunestoneDetails();
  }, [visitedRunestonesStore.visitedCount, authStore.isFullyAuthenticated, visitedRunestonesStore.loading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSignOut = async () => {
    try {
      await authStore.signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete your account and all associated data? This cannot be undone.')) {
        authStore.deleteUser();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'Delete your account and all associated data? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => authStore.deleteUser() },
        ]
      );
    }
  };

  // Loading state
  if (authStore.loading || visitedRunestonesStore.loading || detailsLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Stack.Screen options={{ title: 'Profile' }} />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  // Error state
  if (visitedRunestonesStore.error || detailsError) {
    const errorMessage = visitedRunestonesStore.error || detailsError;
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
        <Stack.Screen options={{ title: 'Error' }} />
        <View className="mb-4 bg-red-100 p-4 rounded-full">
          {/* Simple Red Circle for Error */}
          <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
            <Text className="text-white font-bold">!</Text>
          </View>
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">Error</Text>
        <Text className="text-gray-600 mb-6">{errorMessage}</Text>
        <Link href="/" asChild>
          <TouchableOpacity className="bg-primary px-6 py-2 rounded-md">
            <Text className="text-white font-medium">Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  // Not Logged In
  if (!authStore.user) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
        <Stack.Screen options={{ title: 'Not Logged In' }} />
        <View className="mb-4 bg-gray-200 p-4 rounded-full">
          <View className="w-8 h-8 rounded-full bg-gray-400" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</Text>
        <Text className="text-gray-600 mb-6">Please log in to view your profile and visited runestones.</Text>
        <Link href="/" asChild>
          <TouchableOpacity className="bg-primary px-6 py-2 rounded-md">
            <Text className="text-white font-medium">Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  // Email Confirmation Required
  if (authStore.user && !authStore.isEmailConfirmed) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
        <Stack.Screen options={{ title: 'Email Required' }} />
        <View className="mb-4 bg-yellow-100 p-4 rounded-full">
          <View className="w-8 h-8 rounded-full bg-yellow-500 items-center justify-center">
            <Text className="text-white font-bold">!</Text>
          </View>
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">Email Confirmation Required</Text>
        <Text className="text-gray-600 mb-4">
          Please check your email ({authStore.user.email}) and click the confirmation link to access your profile.
        </Text>
        <Text className="text-sm text-gray-500 mb-6">
          Once confirmed, you'll be able to view your visited runestones and track your progress.
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity className="bg-primary px-6 py-2 rounded-md">
            <Text className="text-white font-medium">Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Profile' }} />
      <PageHeader title="Profile" />

      <View className="md:p-8 lg:p-12">
        <View className="md:max-w-5xl md:mx-auto w-full bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-100 overflow-hidden">

          <View className="p-4 md:p-6">
            {/* User Info Section */}
            <View className="bg-gray-50 rounded-lg p-8 mb-8">
              <View className="flex-row items-center space-x-6">
                <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-semibold">
                    {authStore.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View className="flex-1 ml-6">
                  <Text className="text-2xl font-semibold text-gray-900" numberOfLines={1}>
                    {authStore.user?.email}
                  </Text>
                  <Text className="text-base text-gray-500 mt-1">
                    Member since {authStore.user?.created_at ? formatDate(authStore.user.created_at) : 'Unknown'}
                  </Text>
                </View>
              </View>

              <View className="flex-row mt-8 space-x-4">
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-md items-center justify-center flex-row"
                >
                  <Text className="text-gray-700 font-medium ml-2">Sign Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  className="flex-1 bg-red-600 py-3 rounded-md items-center justify-center ml-4"
                >
                  <Text className="text-white font-medium">Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Section */}
            <View className="flex-row flex-wrap justify-between gap-4 mb-8">
              <View className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-6 mb-4">
                <View className="w-10 h-10 bg-green-100 rounded-md items-center justify-center mb-3">
                  <Text className="text-green-600 font-bold text-lg">✓</Text>
                </View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Visited</Text>
                <Text className="text-3xl font-semibold text-gray-900">{visitedRunestonesStore.visitedCount}</Text>
              </View>

              <View className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-6 mb-4 mx-2">
                <View className="w-10 h-10 bg-blue-100 rounded-md items-center justify-center mb-3">
                  <Text className="text-blue-600 font-bold text-lg">M</Text>
                </View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Total</Text>
                <Text className="text-3xl font-semibold text-gray-900">{visitedRunestonesStore.totalRunestonesCount}</Text>
              </View>

              <View className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-6 mb-4">
                <View className="w-10 h-10 bg-purple-100 rounded-md items-center justify-center mb-3">
                  <Text className="text-purple-600 font-bold text-lg">%</Text>
                </View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Done</Text>
                <Text className="text-3xl font-semibold text-gray-900">{visitedRunestonesStore.completionPercentage}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-50 rounded-lg p-6 mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-medium text-gray-900">Progress</Text>
                <Text className="text-sm text-gray-500">
                  {visitedRunestonesStore.visitedCount} of {visitedRunestonesStore.totalRunestonesCount}
                </Text>
              </View>
              <View className="w-full bg-gray-200 rounded-full h-3">
                <View
                  className="bg-primary h-3 rounded-full"
                  style={{ width: `${visitedRunestonesStore.completionPercentage}%` }}
                />
              </View>
            </View>

            {/* Visited Runestones List */}
            <View className="bg-gray-50 rounded-lg p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-medium text-gray-900">Visited Runestones</Text>
                <Text className="text-sm text-gray-500">
                  {visitedRunestoneDetails.length}
                </Text>
              </View>

              {visitedRunestoneDetails.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-gray-600">You haven't visited any runestones yet.</Text>
                  <Text className="text-sm text-gray-500 mt-1">Start exploring to see them here!</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {visitedRunestoneDetails.map((runestone) => (
                    <View key={runestone.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 mr-4">
                          <Text className="text-lg font-medium text-gray-900" numberOfLines={1}>{runestone.signature_text}</Text>
                          <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>{runestone.found_location}</Text>
                        </View>
                        <Link href={`/runestones/${runestone.slug}`} asChild>
                          <TouchableOpacity className="bg-white border border-gray-300 px-4 py-2 rounded-md">
                            <Text className="text-gray-700 font-medium">View</Text>
                          </TouchableOpacity>
                        </Link>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>

        </View>
      </View>
    </ScrollView>
  );
});
