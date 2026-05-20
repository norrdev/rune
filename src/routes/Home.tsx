import { useState, useEffect } from 'react';
import { MapComponent } from '../components/Map/MapComponent';
import { Sidebar } from '../components/Sidebar/Sidebar';

export default function Home() {
  const [visitedCount, setVisitedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 flex-row bg-gray-50 h-full w-full overflow-hidden">
      {/* Mobile menu: fixed to viewport so we are not clipped by #root padding context; max() gives a minimum inset when env(safe-area-*) is 0 (common on Android WebView). */}
      {isMobile && !sidebarOpen && (
        <button
          type="button"
          className="fixed z-30 bg-white rounded-full w-12 h-12 flex items-center justify-center border border-gray-200 shadow-md hover:bg-gray-50 focus:outline-none top-[calc(0.25rem+max(2.75rem,env(safe-area-inset-top,0px)))] left-[calc(0.25rem+max(1rem,env(safe-area-inset-left,0px)))]"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <span className="text-black font-bold text-lg leading-none">☰</span>
        </button>
      )}

      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && (
        <Sidebar
          visitedCount={visitedCount}
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content (Map) */}
      <div className="flex-1 relative">
        <MapComponent onVisitedCountChange={setVisitedCount} />
      </div>
    </div>
  );
}
