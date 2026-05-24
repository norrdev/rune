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
      <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50 overflow-y-auto items-center justify-center p-4">
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
      <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50 overflow-y-auto">
        <PageHeader title="Error" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-red-100 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link
            to="/"
            className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!authStore.user) {
    return (
      <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50 overflow-y-auto">
        <PageHeader title="Not Logged In" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-gray-200 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile and visited runestones.
          </p>
          <Link
            to="/"
            className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Email Confirmation Required
  if (authStore.user && !authStore.isEmailConfirmed) {
    return (
      <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50 overflow-y-auto">
        <PageHeader title="Email Required" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 bg-yellow-100 p-4 rounded-full">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Confirmation Required</h2>
          <p className="text-gray-600 mb-4">
            Please check your email (<span className="font-medium">{authStore.user.email}</span>)
            and click the confirmation link to access your profile.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Once confirmed, you'll be able to view your visited runestones and track your progress.
          </p>
          <Link
            to="/"
            className="bg-primary px-6 py-2 rounded-md hover:bg-primary-dark transition text-white font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50/40 overflow-y-auto">
      <PageHeader title="Profile" />

      <div className="p-4 md:p-8 lg:p-12 flex-1 w-full max-w-5xl mx-auto">
        <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-150/80 overflow-hidden">
          <div className="p-4 md:p-6">
            {/* User Info Section */}
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-white border border-gray-150 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
              <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-3xl font-extrabold font-display">
                    {authStore.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-[200px] overflow-hidden">
                  <h2
                    className="text-2xl font-extrabold font-display tracking-tight text-gray-850 truncate"
                    title={authStore.user?.email}
                  >
                    {authStore.user?.email}
                  </h2>
                  <p className="text-sm font-semibold text-gray-400 mt-1">
                    Explorer since{' '}
                    {authStore.user?.created_at ? formatDate(authStore.user.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row mt-8 gap-4">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 bg-white border border-gray-250 hover:border-gray-400 hover:bg-gray-50/50 h-11 rounded-xl flex items-center justify-center hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
                >
                  <span className="text-gray-700 font-semibold text-sm">Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-50 hover:bg-red-100/90 border border-red-150 h-11 rounded-xl flex items-center justify-center hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
                >
                  <span className="text-red-650 font-semibold text-sm">Delete Account</span>
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Visited Card */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm transition hover:shadow hover:-translate-y-0.5 duration-300">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                  <span className="text-emerald-500 font-bold text-lg">✓</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Visited</div>
                <div className="text-3xl font-extrabold font-display text-gray-850">
                  {visitedRunestonesStore.visitedCount}
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm transition hover:shadow hover:-translate-y-0.5 duration-300">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center mb-4 border border-primary/10">
                  <span className="text-primary font-bold text-lg">𖡡</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Stones</div>
                <div className="text-3xl font-extrabold font-display text-gray-855">
                  {visitedRunestonesStore.totalRunestonesCount}
                </div>
              </div>

              {/* Completion Card */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm transition hover:shadow hover:-translate-y-0.5 duration-300">
                <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center mb-4 border border-accent/10">
                  <span className="text-accent font-bold text-lg">%</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Completion</div>
                <div className="text-3xl font-extrabold font-display text-gray-855">
                  {visitedRunestonesStore.completionPercentage}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-800 font-display">Adventure Progress</span>
                <span className="text-xs font-semibold text-gray-450">
                  {visitedRunestonesStore.visitedCount} of{' '}
                  {visitedRunestonesStore.totalRunestonesCount}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner border border-gray-100">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${visitedRunestonesStore.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Visited Runestones List */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-bold text-gray-800 font-display">Visited Runestones</h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {visitedRunestoneDetails.length}
                </span>
              </div>

              {visitedRunestoneDetails.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-semibold text-sm">
                    You haven't visited any runestones yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Start exploring the map to track your journey!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visitedRunestoneDetails.map((runestone) => (
                    <div
                      key={runestone.id}
                      className="bg-white rounded-2xl border border-gray-150 p-4 hover:border-primary/20 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="overflow-hidden">
                          <h4
                            className="text-sm font-bold text-gray-850 truncate"
                            title={runestone.signature_text}
                          >
                            {runestone.signature_text}
                          </h4>
                          <p
                            className="text-xs text-gray-450 mt-1 truncate"
                            title={runestone.found_location}
                          >
                            {runestone.found_location}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/runestones/${runestone.slug}`}
                        className="w-full h-9 bg-gray-50 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center text-xs font-bold text-gray-650 transition-all duration-300 border border-gray-200/60 hover:border-transparent cursor-pointer"
                      >
                        <span>View Details</span>
                      </Link>
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
