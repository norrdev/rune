import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import type { Runestone } from '../types';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { PageHeader } from '../components/PageHeader';
import { MiniMap } from '../components/MiniMap/MiniMap';
import { RunestoneMedia } from '../components/Runestone/components/RunestoneMedia';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';

export const RunestoneDetail = observer(function RunestoneDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [runestone, setRunestone] = useState<Runestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  const [visitedError, setVisitedError] = useState<string | null>(null);

  const isVisited = runestone ? visitedRunestonesStore.isRunestoneVisited(runestone.id) : false;

  useEffect(() => {
    const fetchRunestone = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await runestonesCache.getRunestoneBySlug(slug);
        setRunestone(data);

        if (!data) {
          setError('Runestone not found');
        }
      } catch (err) {
        console.error('Error fetching runestone:', err);
        setError('Failed to load runestone');
      } finally {
        setLoading(false);
      }
    };

    fetchRunestone();
  }, [slug]);

  const handleMarkAsVisited = async () => {
    if (!runestone) return;

    setIsMarkingVisited(true);
    setVisitedError(null);

    try {
      if (isVisited) {
        await visitedRunestonesStore.unmarkAsVisited(runestone.id);
      } else {
        await visitedRunestonesStore.markAsVisited(runestone.id);
      }
    } catch (error) {
      console.error('Error marking as visited:', error);
      setVisitedError('Failed to update visited status. Please try again.');
    } finally {
      setIsMarkingVisited(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader title="Loading..." />
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading runestone...</p>
        </div>
      </div>
    );
  }

  if (error || !runestone) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader title="Error" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Runestone Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="bg-primary px-6 py-2 rounded-lg text-white font-medium hover:bg-blue-600">
            ← Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
      <PageHeader title={runestone.signature_text || `Runestone ${runestone.id}`} />

      <div className="px-4 py-4 md:py-8 md:max-w-4xl md:mx-auto w-full">
        <div className="flex flex-col gap-6">
          {/* Mini Map */}
          <MiniMap runestone={runestone} />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col gap-6">
                {/* Location Details */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Location Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-1">
                    <span className="text-gray-800 font-medium">{runestone.found_location}</span>
                    <span className="text-sm text-gray-600">{runestone.parish}</span>
                    {!!runestone.district && <span className="text-sm text-gray-600">{runestone.district}</span>}
                    {!!runestone.municipality && <span className="text-sm text-gray-600">{runestone.municipality}</span>}
                    {!!runestone.current_location && (
                      <span className="text-sm text-gray-600">Current: {runestone.current_location}</span>
                    )}
                    {runestone.latitude !== null && runestone.longitude !== null && (
                      <span className="text-sm text-gray-600">
                        {runestone.latitude}, {runestone.longitude}
                      </span>
                    )}
                  </div>
                </div>

                <RunestoneMedia runestone={runestone} />

                {/* Visit Status */}
                {authStore.user && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Visit Status</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {visitedRunestonesStore.loading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full border-2 ${isVisited ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'
                                }`}
                            />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {isVisited ? 'Visited' : 'Not visited'}
                          </span>
                        </div>
                        <button
                          onClick={handleMarkAsVisited}
                          disabled={isMarkingVisited || visitedRunestonesStore.loading}
                          className={`px-4 py-2 rounded-md transition ${isVisited
                            ? 'bg-red-100 hover:bg-red-200 focus:ring-red-500'
                            : 'bg-green-100 hover:bg-green-200 focus:ring-green-500'
                            } ${isMarkingVisited || visitedRunestonesStore.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {isMarkingVisited ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-currentColor border-t-transparent rounded-full animate-spin"></div>
                              <span className={isVisited ? 'text-red-700' : 'text-green-700'}>Updating...</span>
                            </div>
                          ) : (
                            <span className={`text-sm font-medium ${isVisited ? 'text-red-700' : 'text-green-700'}`}>
                              {isVisited ? 'Mark as not visited' : 'Mark as visited'}
                            </span>
                          )}
                        </button>
                      </div>
                      {!!visitedError && <span className="text-red-600 text-sm mt-2 block">{visitedError}</span>}
                    </div>
                  </div>
                )}

                {/* Basic Details */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-sm">
                      <span className="font-medium">Material:</span> {runestone.material || 'Unknown'}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">Dating:</span> {runestone.dating || 'Unknown'}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">Type:</span> {runestone.rune_type || 'Unknown'}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">Style:</span> {runestone.material_type || 'Unknown'}
                    </span>
                    {!!runestone.carver && (
                      <span className="text-sm">
                        <span className="font-medium">Carver:</span> {runestone.carver}
                      </span>
                    )}
                    {!!runestone.style && (
                      <span className="text-sm">
                        <span className="font-medium">Style:</span> {runestone.style}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-sm">
                      <span className="font-medium">Lost:</span> {runestone.lost ? 'Yes' : 'No'}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">Ornamental:</span> {runestone.ornamental ? 'Yes' : 'No'}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">Recent:</span> {runestone.recent ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                {!!runestone.norse_text && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Norse Text</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 font-mono text-sm m-0 italic">{runestone.norse_text}</p>
                    </div>
                  </div>
                )}

                {!!runestone.transliteration && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Transliteration</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 font-mono text-sm m-0">{runestone.transliteration}</p>
                    </div>
                  </div>
                )}

                {!!runestone.swedish_translation && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Swedish Translation</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 m-0">{runestone.swedish_translation}</p>
                    </div>
                  </div>
                )}

                {!!runestone.english_translation && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">English Translation</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 m-0">{runestone.english_translation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
