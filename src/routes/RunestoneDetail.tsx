import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { PageHeader } from '../components/PageHeader';
import { MiniMap } from '../components/MiniMap/MiniMap';
import { RunestoneDetails } from '../components/Runestone/RunestoneDetails';
import { useVisitToggle } from '../components/Runestone/useVisitToggle';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { runestoneDetailStore } from '../stores/runestoneDetailStore';
import { Check, X, Loader2 } from 'lucide-react';

export const RunestoneDetail = observer(function RunestoneDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (slug) {
      runestoneDetailStore.loadRunestoneBySlug(slug);
    }
    return () => {
      runestoneDetailStore.clear();
    };
  }, [slug]);

  const { runestone, loading, error } = runestoneDetailStore;
  const {
    isVisited,
    isUpdating,
    error: visitedError,
    toggle: handleMarkAsVisited,
  } = useVisitToggle(runestone);

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
              <RunestoneDetails runestone={runestone}>
                {/* Visit Status */}
                {authStore.user && !authStore.isEmailConfirmed && (
                  <div className="text-xs font-medium text-gray-500 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                    Confirm your email to track visits
                  </div>
                )}
                {authStore.isFullyAuthenticated && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Visit Status
                    </h3>
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
                              {isVisited && (
                                <span className="text-white text-[10px] font-bold">✓</span>
                              )}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-750">
                            {isVisited ? 'Visited' : 'Not visited yet'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAsVisited}
                          disabled={isUpdating || visitedRunestonesStore.loading}
                          className={`relative px-4 h-10 rounded-xl font-semibold shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-xs flex items-center gap-2 select-none border ${
                            isUpdating
                              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-wait opacity-80'
                              : isVisited
                                ? 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border-red-200/60 active:scale-95 hover:-translate-y-0.5'
                                : 'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border-emerald-200/60 active:scale-95 hover:-translate-y-0.5'
                          } ${isUpdating || visitedRunestonesStore.loading ? 'cursor-wait pointer-events-none' : ''}`}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                              <span>{isVisited ? 'Unmarking...' : 'Marking as visited...'}</span>
                            </>
                          ) : isVisited ? (
                            <>
                              <X className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                              <span>Mark as not visited</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                              <span>Mark as visited</span>
                            </>
                          )}
                        </button>
                      </div>
                      {!!visitedError && (
                        <span className="text-xs font-semibold text-red-650 bg-red-50/80 p-2.5 rounded-xl border border-red-100/50 mt-3 block">
                          {visitedError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </RunestoneDetails>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
