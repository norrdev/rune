import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { PageHeader } from '../components/PageHeader';
import { getAuthRedirectError, AUTH_REDIRECT_TIMEOUT_MS } from './authRedirectError';

const MIN_PASSWORD_LENGTH = 6;

// Landing page for password reset emails: the link signs the user in with a
// recovery session, which allows setting a new password.
export const ResetPassword = observer(function ResetPasswordPage() {
  const navigate = useNavigate();
  const [linkError] = useState(getAuthRedirectError);
  const [timedOut, setTimedOut] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignedIn = !!authStore.user;

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_REDIRECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authStore.updatePassword(password);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    const failed = !!linkError || timedOut;
    return (
      <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
        <PageHeader title="Reset Password" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {failed ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset link failed</h2>
              <p className="text-gray-600 mb-2">
                {linkError || 'The link is invalid or has expired.'}
              </p>
              <p className="text-gray-600 mb-6">Request a new one from the sign-in page.</p>
              <Link
                to="/login"
                className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium"
              >
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Verifying reset link...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
      <PageHeader title="Reset Password" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-lg">
          <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
            Choose a new password
          </p>

          <input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            className="w-full h-12 px-4 text-sm border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl mb-4 transition-all duration-300 bg-gray-50/40 focus:bg-white shadow-inner"
          />

          {error && (
            <p className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50 mb-4">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full h-12 px-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-semibold hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-none ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </div>
      </div>
    </div>
  );
});
