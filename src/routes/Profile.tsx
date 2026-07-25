import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Download } from 'lucide-react';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { runestonesCache } from '../services/Cache/runestonesCache';
import type { Runestone } from '../types';
import { PageHeader } from '../components/PageHeader';

export const Profile = observer(function ProfilePage() {
  const navigate = useNavigate();
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const [downloadVisitedLoading, setDownloadVisitedLoading] = useState(false);
  const [splitLimit, setSplitLimit] = useState<string>('none');
  const [customLimit, setCustomLimit] = useState<number>(500);

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

  const downloadGpx = async (stones: Runestone[], filename: string) => {
    const escapeXml = (str: string) => {
      return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '&':
            return '&amp;';
          case "'":
            return '&apos;';
          case '"':
            return '&quot;';
          default:
            return c;
        }
      });
    };

    const limit =
      splitLimit === 'none'
        ? undefined
        : splitLimit === 'custom'
          ? customLimit
          : parseInt(splitLimit, 10);

    const generateGpxContent = (chunk: Runestone[], partName: string) => {
      const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Runestone Safari" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(partName)}</name>
    <desc>Runestones exported from Runestone Safari</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

      const waypoints = chunk
        .map((stone) => {
          const descParts = [
            stone.found_location ? `Location: ${stone.found_location}` : null,
            stone.parish ? `Parish: ${stone.parish}` : null,
            stone.municipality ? `Municipality: ${stone.municipality}` : null,
            stone.dating ? `Dating: ${stone.dating}` : null,
            stone.style ? `Style: ${stone.style}` : null,
            stone.carver ? `Carver: ${stone.carver}` : null,
          ].filter(Boolean);

          const detailParts = [];
          if (stone.english_translation) detailParts.push(`EN: ${stone.english_translation}`);
          if (stone.swedish_translation) detailParts.push(`SV: ${stone.swedish_translation}`);

          const desc = [...descParts, ...detailParts].join(' | ');
          const name = stone.signature_text || `Runestone #${stone.id}`;

          return `  <wpt lat="${stone.latitude}" lon="${stone.longitude}">
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(desc)}</desc>
    <sym>Waypoint</sym>
  </wpt>`;
        })
        .join('\n');

      const gpxFooter = '\n</gpx>';
      return `${gpxHeader}\n${waypoints}${gpxFooter}`;
    };

    const triggerDownload = (content: string, finalFilename: string) => {
      const blob = new Blob([content], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    if (!limit || stones.length <= limit) {
      const cleanName = filename.replace('.gpx', '');
      const content = generateGpxContent(stones, cleanName);
      triggerDownload(content, filename);
    } else {
      const chunks: Runestone[][] = [];
      for (let i = 0; i < stones.length; i += limit) {
        chunks.push(stones.slice(i, i + limit));
      }

      for (let i = 0; i < chunks.length; i++) {
        const partNumber = i + 1;
        const cleanBase = filename.replace('.gpx', '');
        const partFilename = `${cleanBase}_part${partNumber}.gpx`;
        const partName = `${cleanBase} Part ${partNumber}`;
        const content = generateGpxContent(chunks[i], partName);
        triggerDownload(content, partFilename);

        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  };

  const handleDownloadAll = async () => {
    setDownloadAllLoading(true);
    try {
      const allStones = await runestonesCache.getAllRunestones();
      await downloadGpx(allStones, 'all_runestones.gpx');
    } catch (err) {
      console.error('Failed to export all runestones:', err);
      alert('Failed to export all runestones. Please try again.');
    } finally {
      setDownloadAllLoading(false);
    }
  };

  const handleDownloadVisited = async () => {
    if (visitedRunestonesStore.visitedCount === 0) {
      alert('You have not visited any runestones yet.');
      return;
    }
    setDownloadVisitedLoading(true);
    try {
      const visitedStones = await visitedRunestonesStore.getVisitedRunestoneDetails();
      await downloadGpx(visitedStones, 'visited_runestones.gpx');
    } catch (err) {
      console.error('Failed to export visited runestones:', err);
      alert('Failed to export visited runestones. Please try again.');
    } finally {
      setDownloadVisitedLoading(false);
    }
  };

  // Loading state
  if (
    authStore.loading ||
    visitedRunestonesStore.loading ||
    visitedRunestonesStore.detailsLoading
  ) {
    return (
      <div className="flex flex-1 flex-col h-full min-h-0 bg-gray-50 overflow-y-auto items-center justify-center p-4">
        <PageHeader title="Profile" />
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mt-10"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (visitedRunestonesStore.error || visitedRunestonesStore.detailsError) {
    const errorMessage =
      visitedRunestonesStore.error || visitedRunestonesStore.detailsError;
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
            <div className="bg-linear-to-br from-primary/5 via-accent/5 to-white border border-gray-150 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
              <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                <div className="w-20 h-20 bg-linear-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shrink-0 shadow-md">
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
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Visited
                </div>
                <div className="text-3xl font-extrabold font-display text-gray-850">
                  {visitedRunestonesStore.visitedCount}
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm transition hover:shadow hover:-translate-y-0.5 duration-300">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center mb-4 border border-primary/10">
                  <span className="text-primary font-bold text-lg">𖡡</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Stones
                </div>
                <div className="text-3xl font-extrabold font-display text-gray-855">
                  {visitedRunestonesStore.totalRunestonesCount}
                </div>
              </div>

              {/* Completion Card */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm transition hover:shadow hover:-translate-y-0.5 duration-300">
                <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center mb-4 border border-accent/10">
                  <span className="text-accent font-bold text-lg">%</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Completion
                </div>
                <div className="text-3xl font-extrabold font-display text-gray-855">
                  {visitedRunestonesStore.completionPercentage}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-800 font-display">
                  Adventure Progress
                </span>
                <span className="text-xs font-semibold text-gray-450">
                  {visitedRunestonesStore.visitedCount} of{' '}
                  {visitedRunestonesStore.totalRunestonesCount}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner border border-gray-100">
                <div
                  className="bg-linear-to-r from-primary to-accent h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${visitedRunestonesStore.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* GPX Export Section */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-primary font-bold text-lg flex items-center">
                  <Download className="w-5 h-5 text-primary" />
                </span>
                <h3 className="text-sm font-bold text-gray-800 font-display">Export GPX Data</h3>
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Download GPX files to import runestone coordinates into your favorite GPS devices or
                mapping apps (like OsmAnd, Garmin, or Gaia GPS).
              </p>

              {/* GPX Split Configuration */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150/60">
                <div className="flex-1">
                  <label
                    htmlFor="split-limit-select"
                    className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1"
                  >
                    Split GPX Files
                  </label>
                  <p className="text-xs text-gray-400">
                    Older GPS devices or maps might fail to load thousands of stones in a single
                    file.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    id="split-limit-select"
                    value={splitLimit}
                    onChange={(e) => setSplitLimit(e.target.value)}
                    className="bg-white border border-gray-250 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="none">Don't split (single file)</option>
                    <option value="500">Max 500 stones per file</option>
                    <option value="999">Max 999 stones per file</option>
                    <option value="2500">Max 2500 stones per file</option>
                    <option value="custom">Custom limit...</option>
                  </select>
                  {splitLimit === 'custom' && (
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={customLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setCustomLimit(isNaN(val) ? 500 : Math.max(10, val));
                      }}
                      className="w-24 bg-white border border-gray-250 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Limit"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={downloadAllLoading || downloadVisitedLoading}
                  className="bg-white border border-gray-250 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 h-12 rounded-xl flex items-center justify-center hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white"
                >
                  {downloadAllLoading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-gray-700 font-semibold text-sm">
                      Download All Runestones GPX
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVisited}
                  disabled={
                    downloadAllLoading ||
                    downloadVisitedLoading ||
                    visitedRunestonesStore.visitedCount === 0
                  }
                  className="bg-white border border-gray-250 hover:border-emerald-500/30 hover:bg-emerald-50 active:bg-emerald-100 h-12 rounded-xl flex items-center justify-center hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white"
                >
                  {downloadVisitedLoading ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-gray-700 font-semibold text-sm">
                      Download Visited GPX
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Visited Runestones List */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-bold text-gray-800 font-display">Visited Runestones</h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {visitedRunestonesStore.visitedRunestoneDetails.length}
                </span>
              </div>

              {visitedRunestonesStore.visitedRunestoneDetails.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-semibold text-sm">
                    You haven't visited any runestones yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start exploring the map to track your journey!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visitedRunestonesStore.visitedRunestoneDetails.map((runestone) => (
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
