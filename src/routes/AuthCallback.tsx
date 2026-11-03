import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { PageHeader } from '../components/PageHeader';
import { getAuthRedirectError, AUTH_REDIRECT_TIMEOUT_MS } from './authRedirectError';

// Landing page for magic link emails: Supabase picks the session up from the URL,
// then we forward the user to their profile.
export const AuthCallback = observer(function AuthCallbackPage() {
  const navigate = useNavigate();
  const [linkError] = useState(getAuthRedirectError);
  const [timedOut, setTimedOut] = useState(false);
  const isSignedIn = !!authStore.user;

  useEffect(() => {
    if (isSignedIn) {
      navigate('/profile', { replace: true });
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_REDIRECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const failed = !isSignedIn && (!!linkError || timedOut);

  return (
    <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
      <PageHeader title="Sign In" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {failed ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign-in link failed</h2>
            <p className="text-gray-600 mb-6">
              {linkError || 'The link is invalid or has expired.'}
            </p>
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
            <p className="text-gray-600 mt-4">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
});
