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
      <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50">
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
      <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50">
        <PageHeader title="Error" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Runestone Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="bg-primary px-6 py-2 rounded-lg text-white font-medium hover:bg-primary-dark"
          >
            ← Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full flex-col overflow-y-auto bg-gray-50/40">
      <PageHeader title={runestone.signature_text || `Runestone ${runestone.id}`} />

      <div className="px-4 py-6 md:py-8 md:max-w-4xl md:mx-auto w-full">
        <div className="flex flex-col gap-6">
          {/* Mini Map */}
          <MiniMap runestone={runestone} />

          <div className="bg-white rounded-3xl shadow-sm border border-gray-150/80 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col gap-6">
                {/* Location Details */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Location Details</h3>
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1.5">
                    <span className="text-gray-800 font-semibold text-sm">{runestone.found_location}</span>
                    <span className="text-xs text-gray-500 font-medium">{runestone.parish}</span>
                    {!!runestone.district && (
                      <span className="text-xs text-gray-500 font-medium">{runestone.district}</span>
                    )}
                    {!!runestone.municipality && (
                      <span className="text-xs text-gray-500 font-medium">{runestone.municipality}</span>
                    )}
                    {!!runestone.current_location && (
                      <span className="text-xs text-gray-600 font-semibold mt-1 bg-gray-100/60 px-2 py-1 rounded-md w-fit">
                        Current: {runestone.current_location}
                      </span>
                    )}
                    {runestone.latitude !== null && runestone.longitude !== null && (
                      <span className="text-[10px] text-gray-400 font-mono mt-1">
                        {runestone.latitude.toFixed(5)}, {runestone.longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>

                <RunestoneMedia runestone={runestone} />

                {/* Visit Status */}
                {authStore.user && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Visit Status</h3>
                    <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          {visitedRunestonesStore.loading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isVisited
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'bg-gray-200 border-gray-300'
                              }`}
                            >
                              {isVisited && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-750">
                            {isVisited ? 'Visited' : 'Not visited yet'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAsVisited}
                          disabled={isMarkingVisited || visitedRunestonesStore.loading}
                          className={`px-4 h-10 rounded-xl font-semibold shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer text-xs ${
                            isVisited
                              ? 'bg-red-55/90 hover:bg-red-100 text-red-650 border border-red-100/50'
                              : 'bg-emerald-55/90 hover:bg-emerald-100 text-emerald-650 border border-emerald-100/50'
                          } ${isMarkingVisited || visitedRunestonesStore.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isMarkingVisited ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-currentColor border-t-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <span>{isVisited ? 'Mark as not visited' : 'Mark as visited'}</span>
                          )}
                        </button>
                      </div>
                      {!!visitedError && (
                        <span className="text-xs font-semibold text-red-650 bg-red-50/80 p-2.5 rounded-xl border border-red-100/50 mt-3 block">{visitedError}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Grid of Details & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Details</h3>
                    <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2 shadow-sm h-full">
                      <div className="text-xs text-gray-650 flex items-center justify-between">
                        <span className="font-semibold">Material:</span>
                        <span className="text-gray-800 font-semibold">{runestone.material || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-650 flex items-center justify-between">
                        <span className="font-semibold">Dating:</span>
                        <span className="text-gray-800 font-semibold">{runestone.dating || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-650 flex items-center justify-between">
                        <span className="font-semibold">Type:</span>
                        <span className="text-gray-800 font-semibold">{runestone.rune_type || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-650 flex items-center justify-between">
                        <span className="font-semibold">Style:</span>
                        <span className="text-gray-800 font-semibold">{runestone.material_type || 'Unknown'}</span>
                      </div>
                      {!!runestone.carver && (
                        <div className="text-xs text-gray-655 flex items-center justify-between">
                          <span className="font-semibold">Carver:</span>
                          <span className="text-gray-800 font-semibold">{runestone.carver}</span>
                        </div>
                      )}
                      {!!runestone.style && (
                        <div className="text-xs text-gray-655 flex items-center justify-between">
                          <span className="font-semibold">Style ID:</span>
                          <span className="text-gray-800 font-semibold">{runestone.style}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Status</h3>
                    <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 shadow-sm h-full justify-center">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-600">Lost:</span>
                        <span className={`px-2.5 py-0.5 rounded-full ${runestone.lost ? 'bg-red-50 text-red-650' : 'bg-gray-100 text-gray-600'}`}>{runestone.lost ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-600">Ornamental:</span>
                        <span className={`px-2.5 py-0.5 rounded-full ${runestone.ornamental ? 'bg-indigo-50 text-indigo-650' : 'bg-gray-100 text-gray-600'}`}>{runestone.ornamental ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-600">Recent:</span>
                        <span className={`px-2.5 py-0.5 rounded-full ${runestone.recent ? 'bg-yellow-50 text-yellow-750' : 'bg-gray-100 text-gray-600'}`}>{runestone.recent ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Content / Translations */}
                <div className="flex flex-col gap-4">
                  {!!runestone.norse_text && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Norse Text</h3>
                      <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-750 text-sm leading-relaxed italic font-semibold m-0">
                          {runestone.norse_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {!!runestone.transliteration && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transliteration</h3>
                      <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-700 text-xs leading-relaxed font-mono tracking-wide m-0">
                          {runestone.transliteration}
                        </p>
                      </div>
                    </div>
                  )}

                  {!!runestone.swedish_translation && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Swedish Translation</h3>
                      <div className="bg-accent/5 p-4 rounded-2xl border-l-4 border-accent/50 shadow-sm">
                        <p className="text-gray-750 text-sm leading-relaxed font-medium m-0">
                          {runestone.swedish_translation}
                        </p>
                      </div>
                    </div>
                  )}

                  {!!runestone.english_translation && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">English Translation</h3>
                      <div className="bg-primary/5 p-4 rounded-2xl border-l-4 border-primary/50 shadow-sm">
                        <p className="text-gray-755 text-sm leading-relaxed font-medium m-0">
                          {runestone.english_translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
