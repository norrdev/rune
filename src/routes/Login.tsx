import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export const Login = observer(function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isMagicLink, setIsMagicLink] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            navigate('/profile', { replace: true });
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
        navigate('/profile', { replace: true });
        return null;
    }

    if (isForgotPassword) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <PageHeader title="Reset Password" />
                <div className="flex-1 flex flex-col px-4 py-6 md:px-8 md:py-8 w-full max-w-lg mx-auto justify-center">
                    <p className="text-base text-gray-600 mb-6">Enter your email to receive password reset instructions</p>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4"
                    />

                    {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                    {success && <p className="text-sm text-green-500 mb-4">{success}</p>}

                    <button
                        onClick={handleResetPassword}
                        disabled={loading}
                        className={`w-full px-4 py-3 bg-primary rounded-lg text-white font-medium mb-6 hover:bg-primary-dark transition ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>

                    <button
                        onClick={() => {
                            setIsForgotPassword(false);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="w-full py-2 text-sm text-primary underline hover:text-primary-dark"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (isMagicLink) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <PageHeader title="Magic Link Sign In" />
                <div className="flex-1 flex flex-col px-4 py-6 md:px-8 md:py-8 w-full max-w-lg mx-auto justify-center">
                    <p className="text-base text-gray-600 mb-6">We'll send you a magic link to sign in without a password</p>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4"
                    />

                    {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                    {success && <p className="text-sm text-green-500 mb-4">{success}</p>}

                    <button
                        onClick={handleMagicLink}
                        disabled={loading}
                        className={`w-full px-4 py-3 bg-primary rounded-lg text-white font-medium mb-6 hover:bg-primary-dark transition ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Magic Link'}
                    </button>

                    <button
                        onClick={() => {
                            setIsMagicLink(false);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="w-full py-2 text-sm text-primary underline hover:text-primary-dark"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PageHeader title={isSignUp ? 'Create Account' : 'Sign In'} />
            <div className="flex-1 flex flex-col px-4 py-6 md:px-8 md:py-8 w-full max-w-lg mx-auto justify-center">
                <p className="text-base text-gray-600 mb-6">
                    {isSignUp ? 'Sign up to track your runestone visits' : 'Welcome back to Runestone Safari'}
                </p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4"
                />

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                {success && <p className="text-sm text-green-500 mb-4">{success}</p>}

                <button
                    onClick={handleAuth}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-primary rounded-lg text-white font-medium mb-6 hover:bg-primary-dark transition ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>

                <div className="flex flex-col gap-4 items-center">
                    <button onClick={handleToggleSignUp} className="text-sm text-primary underline hover:text-primary-dark">
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>

                    <button
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-primary underline hover:text-primary-dark"
                    >
                        Forgot password?
                    </button>

                    <button
                        onClick={() => setIsMagicLink(true)}
                        className="text-sm text-primary underline hover:text-primary-dark"
                    >
                        Sign in with Magic Link
                    </button>
                </div>
            </div>
        </div>
    );
});
