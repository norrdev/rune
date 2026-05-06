import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../../stores/authStore';
import { Link } from 'react-router-dom';

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
        <div className="p-4">
            <span className="text-sm text-gray-500">Loading...</span>
        </div>
    );
  }

  if (authStore.user && !authStore.isEmailConfirmed) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-3">
          Signed up as <span className="font-medium">{authStore.user.email}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex items-start">
             <span className="text-yellow-600 mr-2">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-800">Email confirmation required</div>
              <div className="text-sm text-yellow-700 mt-1">
                Please check your email and click the confirmation link to access your profile.
              </div>
            </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <span className="text-sm text-gray-700">Sign Out</span>
        </button>
      </div>
    );
  }

  if (authStore.user && authStore.isEmailConfirmed) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2">
          Signed in as <span className="font-medium">{authStore.user.email}</span>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            to="/profile"
            className="w-full px-3 py-2 border border-primary rounded hover:bg-primary/10 flex items-center justify-center transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
          >
              <span className="text-sm text-primary">View Profile</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 bg-primary rounded hover:bg-primary/90 flex items-center justify-center transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <span className="text-sm text-white border-0 bg-transparent cursor-pointer font-inherit">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {error && <span className="text-sm text-red-500">{error}</span>}
          {success && <span className="text-sm text-green-500">{success}</span>}
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className={`w-full px-3 py-2 bg-primary text-white rounded flex items-center justify-center focus:ring-2 focus:ring-primary focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 transition-colors cursor-pointer'}`}
          >
            <span className="text-sm font-inherit bg-transparent border-0">{loading ? 'Sending...' : 'Reset Password'}</span>
          </button>
          <button
            onClick={() => {
              setIsForgotPassword(false);
              setError(null);
              setSuccess(null);
            }}
            className="w-full flex items-center justify-center bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary rounded focus:outline-none"
          >
            <span className="text-sm text-primary underline">Back to Sign In</span>
          </button>
      </div>
    );
  }

  if (isMagicLink) {
    return (
      <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {error && <span className="text-sm text-red-500">{error}</span>}
          {success && <span className="text-sm text-green-500">{success}</span>}
          <button
            onClick={handleMagicLink}
            disabled={loading}
            className={`w-full px-3 py-2 bg-primary rounded flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 transition-colors cursor-pointer border-0'}`}
          >
            <span className="text-sm font-inherit bg-transparent border-0">{loading ? 'Sending...' : 'Send Magic Link'}</span>
          </button>
          <button
            onClick={() => {
              setIsMagicLink(false);
              setError(null);
              setSuccess(null);
            }}
            className="w-full flex items-center justify-center bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary rounded focus:outline-none"
          >
            <span className="text-sm text-primary underline">Back to Sign In</span>
          </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
        {success && <span className="text-sm text-green-500">{success}</span>}
        <button
          onClick={handleAuth}
          disabled={loading}
          className={`w-full px-3 py-2 bg-primary rounded flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border-0 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 transition-colors cursor-pointer'}`}
        >
          <span className="text-sm font-inherit">{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
        </button>
        <div className="flex flex-col gap-2">
          <button onClick={handleToggleSignUp} className="w-full flex items-center justify-center bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary rounded focus:outline-none">
             <span className="text-sm text-primary underline">
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
             </span>
          </button>
          <button
            onClick={() => setIsForgotPassword(true)}
            className="w-full flex items-center justify-center bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary rounded focus:outline-none"
          >
            <span className="text-sm text-primary underline">
                Forgot password?
            </span>
          </button>
          <button
            onClick={() => setIsMagicLink(true)}
            className="w-full flex items-center justify-center bg-transparent border-0 cursor-pointer p-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary rounded focus:outline-none"
          >
            <span className="text-sm text-primary underline">
                Sign in with Magic Link
            </span>
          </button>
        </div>
    </div>
  );
});
