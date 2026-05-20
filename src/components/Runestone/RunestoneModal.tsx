import type { Runestone } from '../../types';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/authStore';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import { Link } from 'react-router-dom';
import { RunestoneMedia } from './components/RunestoneMedia';

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

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <h2 className="text-xl font-bold text-gray-800 truncate m-0">
                {runestone.signature_text}
              </h2>
              <Link
                to={`/runestones/${runestone.slug}`}
                className="text-primary text-sm font-medium whitespace-nowrap hover:underline"
              >
                View Full Page
              </Link>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 ml-2 hover:bg-gray-100 rounded-full leading-none flex items-center justify-center"
              aria-label="Close"
            >
              <span className="text-gray-400 text-2xl font-bold leading-none align-middle">
                &times;
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            <div className="flex flex-col gap-4">
              {/* Location */}
              <div>
                <div className="font-semibold text-gray-700 mb-2">Location</div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-800">{runestone.found_location}</div>
                  <div className="text-sm text-gray-600">{runestone.parish}</div>
                  {!!runestone.district && (
                    <div className="text-sm text-gray-600">{runestone.district}</div>
                  )}
                  {!!runestone.municipality && (
                    <div className="text-sm text-gray-600">{runestone.municipality}</div>
                  )}
                  {!!runestone.current_location && (
                    <div className="text-sm text-gray-600">
                      Current: {runestone.current_location}
                    </div>
                  )}
                  {runestone.latitude !== null && runestone.longitude !== null && (
                    <div className="text-sm text-gray-600">
                      {runestone.latitude}, {runestone.longitude}
                    </div>
                  )}
                </div>
              </div>

              {/* Link */}
              <RunestoneMedia runestone={runestone} />

              {/* Basic Details */}
              <div>
                <div className="font-semibold text-gray-700 mb-2">Details</div>
                <div className="bg-gray-50 p-3 rounded flex flex-col gap-1">
                  <div className="text-sm">
                    <span className="font-medium">Material:</span> {runestone.material || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Dating:</span> {runestone.dating || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {runestone.rune_type || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Style:</span>{' '}
                    {runestone.material_type || 'Unknown'}
                  </div>
                  {!!runestone.carver && (
                    <div className="text-sm">
                      <span className="font-medium">Carver:</span> {runestone.carver}
                    </div>
                  )}
                  {!!runestone.style && (
                    <div className="text-sm">
                      <span className="font-medium">Style:</span> {runestone.style}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="font-semibold text-gray-700 mb-2">Status</div>
                <div className="bg-gray-50 p-3 rounded flex flex-col gap-1">
                  <div className="text-sm">
                    <span className="font-medium">Lost:</span> {runestone.lost ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Ornamental:</span>{' '}
                    {runestone.ornamental ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Recent:</span> {runestone.recent ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Translations */}
              {!!runestone.english_translation && (
                <div>
                  <div className="font-semibold text-gray-700 mb-2">English Translation</div>
                  <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <div className="text-gray-800 text-sm leading-relaxed">
                      {runestone.english_translation}
                    </div>
                  </div>
                </div>
              )}
              {!!runestone.swedish_translation && (
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Swedish Translation</div>
                  <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <div className="text-gray-800 text-sm leading-relaxed">
                      {runestone.swedish_translation}
                    </div>
                  </div>
                </div>
              )}
              {!!runestone.norse_text && (
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Norse Text</div>
                  <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <div className="text-gray-800 text-sm leading-relaxed italic font-medium">
                      {runestone.norse_text}
                    </div>
                  </div>
                </div>
              )}
              {!!runestone.transliteration && (
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Transliteration</div>
                  <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <div className="text-gray-800 text-sm leading-relaxed font-mono">
                      {runestone.transliteration}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {authStore.user && !!visitedError && (
            <div className="px-4 pb-2">
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{visitedError}</div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 mt-auto">
            {authStore.user && (
              <button
                type="button"
                onClick={handleMarkAsVisited}
                disabled={loading}
                className={`px-4 h-12 rounded flex items-center gap-2 ${isVisited ? 'bg-red-600' : 'bg-green-600'} ${loading ? 'opacity-50' : ''}`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                )}
                <span className="text-white font-medium">
                  {loading ? 'Processing...' : isVisited ? 'Unmark as Visited' : 'Mark as Visited'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 h-12 bg-gray-500 rounded hover:bg-gray-600 ml-auto"
            >
              <span className="text-white font-medium">Close</span>
            </button>
          </div>
        </div>
      </div>
    );
  },
);
