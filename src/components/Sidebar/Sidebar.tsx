import { observer } from 'mobx-react-lite';
import { SearchWidget } from './widgets/SearchWidget';
import { authStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Cluster styling constants (matching MapComponent)
const CLUSTER_COLORS = {
  SMALL: '#2dd4bf', // Teal/Cyan for clusters with < 100 points
  MEDIUM: '#0d9488', // Deep Teal for clusters with 100-750 points
  LARGE: '#4f46e5', // Indigo for clusters with > 750 points
} as const;

interface SidebarProps {
  visitedCount: number;
  visible?: boolean;
  onClose?: () => void;
}

export const Sidebar = observer(({ visitedCount, visible = false, onClose }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile, if not visible, render nothing
  if (isMobile && !visible) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {visible && isMobile && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 w-full h-full border-none cursor-pointer"
          onClick={onClose}
          aria-label="Close Sidebar"
        />
      )}

      <div
        className={`bg-white/95 backdrop-blur-md border-r border-gray-100 flex flex-col z-50 relative shadow-xl transition-all duration-300
          ${isMobile ? 'fixed top-0 left-0 h-full w-80' : 'w-72 max-w-sm h-full'}
        `}
        style={
          isMobile
            ? { paddingTop: 'max(env(safe-area-inset-top, 0px), 2.75rem)' }
            : {}
        }
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            type="button"
            className="absolute z-50 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all top-4 right-4 cursor-pointer"
            onClick={onClose}
          >
            <span className="text-gray-500 font-semibold text-base">✕</span>
          </button>
        )}

        {/* All content except footer */}
        <div className="flex-1 overflow-y-auto pb-5">
          {/* Header */}
          <div
            className="px-6 pb-5 border-b border-gray-100"
            style={{ paddingTop: 24 }}
          >
            <div className="text-2xl font-extrabold font-display tracking-tight bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">Runestone Safari</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Explore Swedish Runestones</div>
          </div>

          {/* Search Widget */}
          <SearchWidget onClose={onClose} />

          {/* Visited Runestone Count */}
          {authStore.user && (
            <div className="px-4 py-1.5">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-2xl p-4 transition hover:shadow-sm">
                <Link to="/profile" className="flex items-center justify-between group">
                  <div className="text-xs font-semibold text-gray-500 group-hover:text-primary transition-colors">Your Progress</div>
                  <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <span>{visitedCount}</span>
                    <span className="text-[10px] font-normal opacity-90">visited</span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="px-4 py-4 border-t border-gray-100 mt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Map Legend</div>
            <div className="grid grid-cols-1 gap-2.5 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: CLUSTER_COLORS.SMALL }}
                />
                <span className="text-xs font-medium text-gray-600">&lt; 100 runestones</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: CLUSTER_COLORS.MEDIUM }}
                />
                <span className="text-xs font-medium text-gray-600">100-750 runestones</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: CLUSTER_COLORS.LARGE }}
                />
                <span className="text-xs font-medium text-gray-600">&gt; 750 runestones</span>
              </div>
              <div className="h-px bg-gray-200/50 my-1" />
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-sm animate-pulse" />
                <span className="text-xs font-medium text-gray-600">Unvisited stone</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-sm" />
                <span className="text-xs font-medium text-gray-600">Visited stone</span>
              </div>
            </div>
          </div>

          {/* Authentication Section */}
          {authStore.user && authStore.isEmailConfirmed ? (
            <div className="p-4 border-t border-gray-100 mt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Account
              </div>
              <div className="text-xs text-gray-500 truncate block max-w-full mb-3 px-1 font-medium">
                Signed in as <span className="font-semibold text-gray-700">{authStore.user.email}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  className="w-full h-11 border border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-xl flex items-center justify-center text-xs text-primary font-semibold hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300"
                >
                  View Profile
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await authStore.signOut();
                    } catch (err) {
                      console.error('Sign out error:', err);
                    }
                  }}
                  className="w-full h-11 bg-primary hover:bg-primary-dark rounded-xl flex items-center justify-center text-xs text-white font-semibold hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-100 mt-2 flex flex-col items-center gap-3">
              <Link
                to="/login"
                className="w-full h-12 bg-primary hover:bg-primary-dark rounded-xl flex items-center justify-center hover:-translate-y-0.5 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <span className="text-sm font-semibold text-white">Sign In</span>
              </Link>
              <div className="text-xs text-gray-400 text-center">
                Sign in to track your runestone visits
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className="flex flex-wrap justify-center gap-1">
            <Link to="/about" className="text-xs text-gray-400 hover:text-primary transition-colors underline">
              About
            </Link>
            <span className="text-xs text-gray-300">•</span>
            <Link to="/privacy" className="text-xs text-gray-400 hover:text-primary transition-colors underline">
              Privacy
            </Link>
            <span className="text-xs text-gray-300">•</span>
            <Link to="/license" className="text-xs text-gray-400 hover:text-primary transition-colors underline">
              License
            </Link>
          </div>
          <div className="text-[10px] text-gray-400 text-center mt-1.5 font-medium">© 2025-2026 norr.dev</div>
        </div>
      </div>
    </>
  );
});
