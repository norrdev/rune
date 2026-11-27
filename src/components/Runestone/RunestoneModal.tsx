import type { Runestone } from '../../types';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { RunestoneDetails } from './RunestoneDetails';
import { useVisitToggle } from './useVisitToggle';
import { Check, X, Loader2 } from 'lucide-react';

interface RunestoneModalProps {
  runestone: Runestone | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RunestoneModal = observer(({ runestone, isOpen, onClose }: RunestoneModalProps) => {
  const {
    isVisited,
    isUpdating,
    error: visitedError,
    toggle: handleMarkAsVisited,
  } = useVisitToggle(runestone);

  if (!isOpen || !runestone) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <h2 className="text-xl font-bold font-display text-gray-850 truncate m-0">
              {runestone.signature_text}
            </h2>
            {authStore.isFullyAuthenticated && isVisited && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold shrink-0 transition-all duration-300">
                <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                Visited
              </span>
            )}
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
          <RunestoneDetails runestone={runestone} />
        </div>

        {/* Error Message */}
        {authStore.isFullyAuthenticated && !!visitedError && (
          <div className="px-6 pb-3">
            <div className="text-xs font-semibold text-red-650 bg-red-50/80 p-3 rounded-xl border border-red-100/50">
              {visitedError}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-gray-100 mt-auto bg-gray-50/40">
          {authStore.user && !authStore.isEmailConfirmed && (
            <span className="text-xs font-medium text-gray-500">
              Confirm your email to track visits
            </span>
          )}
          {authStore.isFullyAuthenticated && (
            <button
              type="button"
              onClick={handleMarkAsVisited}
              disabled={isUpdating}
              className={`relative px-5 h-11 rounded-xl flex items-center gap-2.5 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-none select-none overflow-hidden ${
                isUpdating
                  ? isVisited
                    ? 'bg-red-400/90 cursor-wait opacity-90'
                    : 'bg-emerald-500/90 cursor-wait opacity-90'
                  : isVisited
                    ? 'bg-red-500 hover:bg-red-600 active:scale-95 active:bg-red-700 hover:-translate-y-0.5'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:bg-emerald-800 hover:-translate-y-0.5'
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{isVisited ? 'Unmarking...' : 'Marking as visited...'}</span>
                </>
              ) : isVisited ? (
                <>
                  <X className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span>Unmark as Visited</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span>Mark as Visited</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-6 h-11 bg-gray-400 hover:bg-gray-500 active:scale-95 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 ml-auto cursor-pointer border-none"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
