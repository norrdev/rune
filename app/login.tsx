import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { authStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';

export default observer(function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isMagicLink, setIsMagicLink] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

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
            // Redirect to profile or home after successful login
            router.push('/profile');
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

    const handleToggleSignUp = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setSuccess(null);
    };

    // If already logged in, redirect to profile
    if (authStore.user && authStore.isEmailConfirmed) {
        router.replace('/profile');
        return null;
    }

    if (isForgotPassword) {
        return (
            <ScrollView className="flex-1 bg-gray-50">
                <PageHeader title="Reset Password" />
                <View className="flex-1 items-center justify-center px-4" style={{ paddingBottom: insets.bottom + 20 }}>
                    <View className="w-full md:max-w-sm bg-white md:rounded-lg md:shadow-lg p-6 gap-4">
                        <Text className="text-sm text-gray-600 mb-4">Enter your email to receive password reset instructions</Text>

                        <TextInput
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                        />

                        {error && <Text className="text-sm text-red-500">{error}</Text>}
                        {success && <Text className="text-sm text-green-500">{success}</Text>}

                        <Pressable
                            onPress={handleResetPassword}
                            disabled={loading}
                            className={`w-full px-4 py-3 bg-primary rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-sm font-medium text-white">{loading ? 'Sending...' : 'Reset Password'}</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setIsForgotPassword(false);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="w-full items-center py-2"
                        >
                            <Text className="text-sm text-primary underline">Back to Sign In</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        );
    }

    if (isMagicLink) {
        return (
            <ScrollView className="flex-1 bg-gray-50">
                <PageHeader title="Magic Link Sign In" />
                <View className="flex-1 items-center justify-center px-4" style={{ paddingBottom: insets.bottom + 20 }}>
                    <View className="w-full md:max-w-sm bg-white md:rounded-lg md:shadow-lg p-6 gap-4">
                        <Text className="text-sm text-gray-600 mb-4">We'll send you a magic link to sign in without a password</Text>

                        <TextInput
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                        />

                        {error && <Text className="text-sm text-red-500">{error}</Text>}
                        {success && <Text className="text-sm text-green-500">{success}</Text>}

                        <Pressable
                            onPress={handleMagicLink}
                            disabled={loading}
                            className={`w-full px-4 py-3 bg-primary rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-sm font-medium text-white">{loading ? 'Sending...' : 'Send Magic Link'}</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setIsMagicLink(false);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="w-full items-center py-2"
                        >
                            <Text className="text-sm text-primary underline">Back to Sign In</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <PageHeader title={isSignUp ? 'Create Account' : 'Sign In'} />
            <View className="flex-1 items-center justify-center px-4" style={{ paddingBottom: insets.bottom + 20 }}>
                <View className="w-full md:max-w-sm bg-white md:rounded-lg md:shadow-lg p-6 gap-4">
                    <Text className="text-sm text-gray-600 mb-4">
                        {isSignUp ? 'Sign up to track your runestone visits' : 'Welcome back to Runestone Safari'}
                    </Text>

                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    />

                    <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    />

                    {error && <Text className="text-sm text-red-500">{error}</Text>}
                    {success && <Text className="text-sm text-green-500">{success}</Text>}

                    <Pressable
                        onPress={handleAuth}
                        disabled={loading}
                        className={`w-full px-4 py-3 bg-primary rounded-lg items-center ${loading ? 'opacity-50' : ''}`}
                    >
                        <Text className="text-sm font-medium text-white">
                            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </Text>
                    </Pressable>

                    <View className="gap-3 mt-2">
                        <Pressable onPress={handleToggleSignUp} className="w-full items-center">
                            <Text className="text-sm text-primary underline">
                                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setIsForgotPassword(true)}
                            className="w-full items-center"
                        >
                            <Text className="text-sm text-primary underline">Forgot password?</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setIsMagicLink(true)}
                            className="w-full items-center"
                        >
                            <Text className="text-sm text-primary underline">Sign in with Magic Link</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
});
