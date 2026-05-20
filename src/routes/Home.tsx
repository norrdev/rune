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
    <div className="flex flex-1 flex-row bg-gray-50 h-full w-full overflow-hidden">
      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <button
          type="button"
          className="absolute z-30 bg-white rounded-full w-12 h-12 flex items-center justify-center border border-gray-200 shadow-md hover:bg-gray-50 focus:outline-none"
          style={{
            top: 16,
            left: 16,
          }}
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
