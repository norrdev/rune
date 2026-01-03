import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../../stores/authStore';
import { Link } from 'expo-router';

export const AuthWidget = observer(() => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await authStore.signUp(email, password);
      } else {
        await authStore.signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await authStore.signInWithMagicLink(email);
      setSuccess('Check your email for the magic link');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await authStore.resetPassword(email);
      setSuccess('Password reset instructions have been sent to your email');
      setIsForgotPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authStore.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
  };

  if (authStore.loading) {
    return (
        <View className="p-4">
            <Text className="text-sm text-gray-500">Loading...</Text>
        </View>
    );
  }

  if (authStore.user && !authStore.isEmailConfirmed) {
    return (
      <View className="p-4 border-t border-gray-200">
        <Text className="text-sm text-gray-600 mb-3">
          Signed up as <Text className="font-medium">{authStore.user.email}</Text>
        </Text>
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex-row items-start">
             {/* Icon placeholder (simplified) */}
             <Text className="text-yellow-600 mr-2">⚠️</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-yellow-800">Email confirmation required</Text>
              <Text className="text-sm text-yellow-700 mt-1">
                Please check your email and click the confirmation link to access your profile.
              </Text>
            </View>
        </View>
        <Pressable
          onPress={handleSignOut}
          className="w-full px-3 py-2 border border-gray-300 rounded active:bg-gray-50 flex items-center"
        >
          <Text className="text-sm text-gray-700">Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  if (authStore.user && authStore.isEmailConfirmed) {
    return (
      <View className="p-4 border-t border-gray-200">
        <Text className="text-sm text-gray-600 mb-2">
          Signed in as <Text className="font-medium">{authStore.user.email}</Text>
        </Text>
        <View className="gap-2">
          <Link href="/profile" asChild>
            <Pressable className="w-full px-3 py-2 border border-primary rounded active:bg-primary/10 flex-row items-center justify-center">
                <Text className="text-sm text-primary">View Profile</Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={handleSignOut}
            className="w-full px-3 py-2 bg-primary rounded active:bg-primary/90 flex items-center"
          >
            <Text className="text-sm text-white">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isForgotPassword) {
    return (
      <View className="p-4 border-t border-gray-200 gap-3">
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
          />
          {error && <Text className="text-sm text-red-500">{error}</Text>}
          {success && <Text className="text-sm text-green-500">{success}</Text>}
          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            className={`w-full px-3 py-2 bg-primary rounded flex items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-sm text-white">{loading ? 'Sending...' : 'Reset Password'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsForgotPassword(false);
              setError(null);
              setSuccess(null);
            }}
            className="w-full items-center"
          >
            <Text className="text-sm text-primary underline">Back to Sign In</Text>
          </Pressable>
      </View>
    );
  }

  if (isMagicLink) {
    return (
      <View className="p-4 border-t border-gray-200 gap-3">
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
          />
          {error && <Text className="text-sm text-red-500">{error}</Text>}
          {success && <Text className="text-sm text-green-500">{success}</Text>}
          <Pressable
            onPress={handleMagicLink}
            disabled={loading}
            className={`w-full px-3 py-2 bg-primary rounded flex items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-sm text-white">{loading ? 'Sending...' : 'Send Magic Link'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsMagicLink(false);
              setError(null);
              setSuccess(null);
            }}
            className="w-full items-center"
          >
            <Text className="text-sm text-primary underline">Back to Sign In</Text>
          </Pressable>
      </View>
    );
  }

  return (
    <View className="p-4 border-t border-gray-200 gap-3">
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
        />
        {error && <Text className="text-sm text-red-500">{error}</Text>}
        {success && <Text className="text-sm text-green-500">{success}</Text>}
        <Pressable
          onPress={handleAuth}
          disabled={loading}
          className={`w-full px-3 py-2 bg-primary rounded flex items-center ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-sm text-white">{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        </Pressable>
        <View className="gap-2">
          <Pressable onPress={handleToggleSignUp} className="w-full items-center">
             <Text className="text-sm text-primary underline">
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
             </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsForgotPassword(true)}
            className="w-full items-center"
          >
            <Text className="text-sm text-primary underline">
                Forgot password?
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsMagicLink(true)}
            className="w-full items-center"
          >
            <Text className="text-sm text-primary underline">
                Sign in with Magic Link
            </Text>
          </Pressable>
        </View>
    </View>
  );
});
