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
      <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
        <PageHeader title="Reset Password" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-lg">
            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
              Enter your email to receive password reset instructions
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
            />

            {error && (
              <p className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50 mb-4">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs font-semibold text-emerald-650 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100/50 mb-4">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className={`w-full h-12 px-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-semibold mb-6 hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-none ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setSuccess(null);
              }}
              className="w-full py-2.5 text-xs text-primary font-semibold hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMagicLink) {
    return (
      <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
        <PageHeader title="Magic Link" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-lg">
            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
              We'll send you a magic link to sign in without a password
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
            />

            {error && (
              <p className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50 mb-4">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs font-semibold text-emerald-650 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100/50 mb-4">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className={`w-full h-12 px-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-semibold mb-6 hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-none ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMagicLink(false);
                setError(null);
                setSuccess(null);
              }}
              className="w-full py-2.5 text-xs text-primary font-semibold hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
      <PageHeader title={isSignUp ? 'Create Account' : 'Sign In'} />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-150 rounded-3xl p-6 md:p-10 shadow-lg">
          <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
            {isSignUp
              ? 'Sign up to track your runestone visits'
              : 'Welcome back to Runestone Safari'}
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
          />

          {error && (
            <p className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50 mb-4">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-semibold text-emerald-650 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100/50 mb-4">
              {success}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className={`w-full h-12 px-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-semibold mb-6 hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-none ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <div className="flex flex-col gap-2 items-center">
            <button
              type="button"
              onClick={handleToggleSignUp}
              className="text-xs font-semibold p-2 text-primary hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-xs font-semibold p-2 text-primary hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer"
            >
              Forgot password?
            </button>

            <button
              type="button"
              onClick={() => setIsMagicLink(true)}
              className="text-xs font-semibold p-2 text-primary hover:text-primary-dark transition-colors border-none bg-transparent cursor-pointer"
            >
              Sign in with Magic Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
