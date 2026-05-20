import { observer } from 'mobx-react-lite';
import { SearchWidget } from './widgets/SearchWidget';
import { authStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Cluster styling constants (matching MapComponent)
const CLUSTER_COLORS = {
  SMALL: '#8B4513', // Dark brown for clusters with < 100 points
  MEDIUM: '#A0522D', // Medium brown for clusters with 100-750 points
  LARGE: '#CD853F', // Light brown for clusters with > 750 points
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
          className="absolute inset-0 bg-black/50 z-40 w-full h-full border-none"
          onClick={onClose}
          aria-label="Close Sidebar"
        />
      )}

      <div
        className={`bg-white border-r border-gray-200 flex flex-col z-50 relative
          ${isMobile ? 'absolute top-0 left-0 h-full w-80' : 'w-64 max-w-sm h-full'}
        `}
        style={isMobile ? { paddingTop: 'env(safe-area-inset-top)' } : {}}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            type="button"
            className="absolute z-50 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow"
            style={{
              top: 16,
              right: 16,
            }}
            onClick={onClose}
          >
            <span className="text-gray-600 font-bold text-lg">✕</span>
          </button>
        )}

        {/* All content except footer */}
        <div className="flex-1 overflow-y-auto pb-5">
          {/* Header */}
          <div
            className="px-6 pb-6 border-b border-gray-200"
            style={{ paddingTop: isMobile ? 24 : 24 }}
          >
            <div className="text-2xl font-bold text-primary">Runestone Safari</div>
            <div className="text-base text-gray-600 mt-1">Explore Swedish runestones</div>
          </div>

          {/* Search Widget */}
          <SearchWidget onClose={onClose} />

          {/* Visited Runestone Count */}
          {authStore.user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex flex-col items-center">
                <Link to="/profile" className="text-base text-gray-600 hover:text-gray-800">
                  <span className="font-medium text-primary">{visitedCount}</span> visited
                  runestones
                </Link>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">Map Legend:</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS.SMALL }}
                />
                <span className="text-sm text-gray-600">&lt; 100 stones</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS.MEDIUM }}
                />
                <span className="text-sm text-gray-600">100-750 stones</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS.LARGE }}
                />
                <span className="text-sm text-gray-600">&gt; 750 stones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                <span className="text-sm text-gray-600">Unvisited stone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                <span className="text-sm text-gray-600">Visited stone</span>
              </div>
            </div>
          </div>

          {/* Authentication Section */}
          {authStore.user && authStore.isEmailConfirmed ? (
            <div className="p-4 border-t border-gray-200">
              <div className="text-base text-gray-600 mb-2">
                Signed in as <span className="font-medium">{authStore.user.email}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  className="w-full px-3 py-2 border border-primary rounded hover:bg-primary/10 flex items-center justify-center text-base text-primary"
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
                  className="w-full px-3 py-2 bg-primary rounded hover:bg-primary-dark flex items-center justify-center text-base text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-200 flex flex-col items-center">
              <Link
                to="/login"
                className="w-full px-4 py-3 bg-primary rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
              >
                <span className="text-base font-medium text-white">Sign In</span>
              </Link>
              <div className="text-sm text-gray-500 text-center mt-2">
                Sign in to track your runestone visits
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto">
          <div className="flex flex-wrap justify-center gap-1">
            <Link to="/about" className="text-xs text-gray-500 hover:text-gray-700 underline">
              About
            </Link>
            <span className="text-xs text-gray-500">•</span>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-700 underline">
              Privacy Policy
            </Link>
            <span className="text-xs text-gray-500">•</span>
            <Link to="/license" className="text-xs text-gray-500 hover:text-gray-700 underline">
              License
            </Link>
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">© 2025 Denis Filonov</div>
        </div>
      </div>
    </>
  );
});
