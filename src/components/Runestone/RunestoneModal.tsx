import type { Runestone } from '../../types';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/authStore';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import { Link } from 'react-router-dom';
import { RunestoneMedia } from './components/RunestoneMedia';
import { createPortal } from 'react-dom';

interface RunestoneModalProps {
  runestone: Runestone | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitedStatusChange?: () => void;
}

export const RunestoneModal = observer(
  ({ runestone, isOpen, onClose, onVisitedStatusChange }: RunestoneModalProps) => {
    const [visitedError, setVisitedError] = useState<string | null>(null);

    const isVisited = runestone ? visitedRunestonesStore.isRunestoneVisited(runestone.id) : false;
    const loading = visitedRunestonesStore.loading;

    if (!isOpen || !runestone) {
      return null;
    }

    const handleMarkAsVisited = async () => {
      if (!runestone) return;
      setVisitedError(null);

      try {
        if (isVisited) {
          await visitedRunestonesStore.unmarkAsVisited(runestone.id);
        } else {
          await visitedRunestonesStore.markAsVisited(runestone.id);
        }
        if (onVisitedStatusChange) {
          onVisitedStatusChange();
        }
      } catch (error) {
        console.error('Error updating visited status:', error);
        setVisitedError('Failed to update visited status. Please try again.');
      }
    };

    return createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-4 overflow-hidden">
              <h2 className="text-xl font-bold font-display text-gray-850 truncate m-0">
                {runestone.signature_text}
              </h2>
              <Link
                to={`/runestones/${runestone.slug}`}
                className="inline-flex items-center px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-350"
              >
                View Full Page
              </Link>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 ml-2 hover:bg-gray-150 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border-none bg-transparent"
              aria-label="Close"
            >
              <span className="text-gray-400 hover:text-gray-600 text-xl font-semibold leading-none">
                ✕
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-5">
              {/* Location */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                  Location
                </div>
                <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1.5">
                  <div className="text-gray-800 font-semibold text-sm">
                    {runestone.found_location}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{runestone.parish}</div>
                  {!!runestone.district && (
                    <div className="text-xs text-gray-500 font-medium">{runestone.district}</div>
                  )}
                  {!!runestone.municipality && (
                    <div className="text-xs text-gray-500 font-medium">
                      {runestone.municipality}
                    </div>
                  )}
                  {!!runestone.current_location && (
                    <div className="text-xs text-gray-600 font-semibold mt-1 bg-gray-100/60 px-2 py-1 rounded-md w-fit">
                      Current: {runestone.current_location}
                    </div>
                  )}
                  {runestone.latitude !== null && runestone.longitude !== null && (
                    <div className="text-[10px] text-gray-400 font-mono mt-1">
                      {runestone.latitude.toFixed(5)}, {runestone.longitude.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>

              {/* Link */}
              <RunestoneMedia runestone={runestone} />

              {/* Grid of Details & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Details */}
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                    Details
                  </div>
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2 shadow-sm h-full">
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span className="font-semibold">Material:</span>
                      <span className="text-gray-800 font-semibold">
                        {runestone.material || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span className="font-semibold">Dating:</span>
                      <span className="text-gray-800 font-semibold">
                        {runestone.dating || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span className="font-semibold">Type:</span>
                      <span className="text-gray-800 font-semibold">
                        {runestone.rune_type || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-between">
                      <span className="font-semibold">Style:</span>
                      <span className="text-gray-800 font-semibold">
                        {runestone.material_type || 'Unknown'}
                      </span>
                    </div>
                    {!!runestone.carver && (
                      <div className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="font-semibold">Carver:</span>
                        <span className="text-gray-800 font-semibold">{runestone.carver}</span>
                      </div>
                    )}
                    {!!runestone.style && (
                      <div className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="font-semibold">Style ID:</span>
                        <span className="text-gray-800 font-semibold">{runestone.style}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                    Status
                  </div>
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 shadow-sm h-full justify-center">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-600">Lost:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${runestone.lost ? 'bg-red-50 text-red-650' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {runestone.lost ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-600">Ornamental:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${runestone.ornamental ? 'bg-indigo-50 text-indigo-650' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {runestone.ornamental ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-600">Recent:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${runestone.recent ? 'bg-yellow-50 text-yellow-750' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {runestone.recent ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Translations */}
              <div className="flex flex-col gap-4">
                {!!runestone.english_translation && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      English Translation
                    </div>
                    <div className="bg-primary/5 p-4 rounded-2xl border-l-4 border-primary/50 shadow-sm">
                      <div className="text-gray-700 text-sm leading-relaxed font-medium">
                        {runestone.english_translation}
                      </div>
                    </div>
                  </div>
                )}
                {!!runestone.swedish_translation && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Swedish Translation
                    </div>
                    <div className="bg-accent/5 p-4 rounded-2xl border-l-4 border-accent/50 shadow-sm">
                      <div className="text-gray-700 text-sm leading-relaxed font-medium">
                        {runestone.swedish_translation}
                      </div>
                    </div>
                  </div>
                )}
                {!!runestone.norse_text && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Norse Text
                    </div>
                    <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-750 text-sm leading-relaxed italic font-semibold">
                        {runestone.norse_text}
                      </div>
                    </div>
                  </div>
                )}
                {!!runestone.transliteration && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Transliteration
                    </div>
                    <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-700 text-xs leading-relaxed font-mono tracking-wide">
                        {runestone.transliteration}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {authStore.user && !!visitedError && (
            <div className="px-6 pb-3">
              <div className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50">
                {visitedError}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center p-5 border-t border-gray-100 mt-auto bg-gray-50/40">
            {authStore.user && (
              <button
                type="button"
                onClick={handleMarkAsVisited}
                disabled={loading}
                className={`px-5 h-11 rounded-xl flex items-center gap-2 text-xs font-bold text-white shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer border-none ${isVisited ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} ${loading ? 'opacity-50' : ''}`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                )}
                <span>
                  {loading ? 'Processing...' : isVisited ? 'Unmark as Visited' : 'Mark as Visited'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 bg-gray-400 hover:bg-gray-500 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-98 transition-all duration-300 ml-auto cursor-pointer border-none"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  },
);
