import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import type { Runestone } from '../types';
import { PageHeader } from '../components/PageHeader';

export const Profile = observer(function ProfilePage() {
  const navigate = useNavigate();
  const [visitedRunestoneDetails, setVisitedRunestoneDetails] = useState<Runestone[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const loadVisitedRunestoneDetails = async () => {
      if (!authStore.isFullyAuthenticated || visitedRunestonesStore.loading) {
        return;
      }

      if (visitedRunestonesStore.visitedCount === 0) {
        setDetailsError(null);
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
  }, [
    authStore.isFullyAuthenticated,
    visitedRunestonesStore.loading,
    visitedRunestonesStore.visitedCount,
  ]);

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
      navigate('/');
    } catch (_e) {
      alert('Failed to sign out');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Delete your account and all associated data? This cannot be undone.')) {
      authStore.deleteUser();
    }
  };

  // Loading state
  if (authStore.loading || visitedRunestonesStore.loading || detailsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto items-center justify-center p-4">
        <PageHeader title="Profile" />
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mt-10"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (visitedRunestonesStore.error || detailsError) {
    const errorMessage = visitedRunestonesStore.error || detailsError;
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
        <PageHeader title="Error" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-red-100 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link to="/" className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!authStore.user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
        <PageHeader title="Not Logged In" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-gray-200 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile and visited runestones.
          </p>
          <Link to="/" className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Email Confirmation Required
  if (authStore.user && !authStore.isEmailConfirmed) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
        <PageHeader title="Email Required" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-yellow-100 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email Confirmation Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please check your email (<span className="font-medium">{authStore.user.email}</span>) and click the confirmation link to access your profile.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Once confirmed, you'll be able to view your visited runestones and track your progress.
          </p>
          <Link to="/" className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
      <PageHeader title="Profile" />

      <div className="p-4 md:p-8 lg:p-12 flex-1 w-full max-w-5xl mx-auto">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6">
            {/* User Info Section */}
            <div className="bg-gray-50 rounded-lg p-6 md:p-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-semibold">
                    {authStore.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className="text-2xl font-semibold text-gray-900 truncate" title={authStore.user?.email}>
                    {authStore.user?.email}
                  </h2>
                  <p className="text-base text-gray-500 mt-1">
                    Member since {authStore.user?.created_at ? formatDate(authStore.user.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row mt-8 gap-4">
                <button
                  onClick={handleSignOut}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-md flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <span className="text-gray-700 font-medium ml-2">Sign Out</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 py-3 rounded-md flex items-center justify-center hover:bg-red-700 transition"
                >
                  <span className="text-white font-medium">Delete Account</span>
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex flex-wrap justify-between gap-4 mb-8">
              <div className="flex-1 min-w-[150px] bg-gray-50 rounded-lg p-6">
                <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center mb-3">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                </div>
                <div className="text-sm font-medium text-gray-500 mb-1">Visited</div>
                <div className="text-3xl font-semibold text-gray-900">
                  {visitedRunestonesStore.visitedCount}
                </div>
              </div>

              <div className="flex-1 min-w-[150px] bg-gray-50 rounded-lg p-6">
                <div className="w-10 h-10 bg-primary-light/25 rounded-md flex items-center justify-center mb-3">
                  <span className="text-primary-dark font-bold text-lg">M</span>
                </div>
                <div className="text-sm font-medium text-gray-500 mb-1">Total</div>
                <div className="text-3xl font-semibold text-gray-900">
                  {visitedRunestonesStore.totalRunestonesCount}
                </div>
              </div>

              <div className="flex-1 min-w-[150px] bg-gray-50 rounded-lg p-6">
                <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center mb-3">
                  <span className="text-purple-600 font-bold text-lg">%</span>
                </div>
                <div className="text-sm font-medium text-gray-500 mb-1">Done</div>
                <div className="text-3xl font-semibold text-gray-900">
                  {visitedRunestonesStore.completionPercentage}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-900">Progress</span>
                <span className="text-sm text-gray-500">
                  {visitedRunestonesStore.visitedCount} of {visitedRunestonesStore.totalRunestonesCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${visitedRunestonesStore.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Visited Runestones List */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Visited Runestones</h3>
                <span className="text-sm text-gray-500 font-medium bg-gray-200 px-2 py-1 rounded-full">{visitedRunestoneDetails.length}</span>
              </div>

              {visitedRunestoneDetails.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <p className="text-gray-600 font-medium">You haven't visited any runestones yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start exploring to see them here!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visitedRunestoneDetails.map((runestone) => (
                    <div
                      key={runestone.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 transition hover:shadow-md"
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-lg font-medium text-gray-900 truncate" title={runestone.signature_text}>
                            {runestone.signature_text}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1 truncate" title={runestone.found_location}>
                            {runestone.found_location}
                          </p>
                        </div>
                        <Link to={`/runestones/${runestone.slug}`} className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition whitespace-nowrap">
                          <span className="text-gray-700 font-medium">View</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
