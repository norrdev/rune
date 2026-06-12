import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { searchStore } from '../../../stores/searchStore';

interface SearchWidgetProps {
  onClose?: () => void;
}

export const SearchWidget = observer(({ onClose }: SearchWidgetProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    searchStore.performSearch(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);

    // Perform search as user types
    if (text.trim()) {
      searchStore.performSearch(text);
    } else {
      searchStore.clearSearch();
    }
  };

  return (
    <div className="p-4">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search runestones..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className="w-full h-11 pl-4 pr-20 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 shadow-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searchStore.isLoading}
          className={`absolute right-1 top-1 bottom-1 flex items-center justify-center px-3 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-dark hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer ${searchStore.isLoading ? 'opacity-50' : ''}`}
        >
          {searchStore.isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>

      {/* Search Results */}
      {searchStore.hasSearched && (
        <div className="mt-4">
          {searchStore.isLoading ? (
            <div className="text-xs text-gray-400 text-center py-4 font-medium animate-pulse">
              Searching the archives...
            </div>
          ) : searchStore.hasResults ? (
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Found {searchStore.resultCount} result{searchStore.resultCount !== 1 ? 's' : ''}
              </div>
              <div className="max-h-64 overflow-y-auto pr-1 flex flex-col gap-1.5">
                {searchStore.searchResults.slice(0, 10).map((runestone) => (
                  <button
                    key={runestone.id}
                    type="button"
                    className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl hover:bg-primary/5 hover:border-primary/20 hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-center min-h-[48px] cursor-pointer group"
                    onClick={() => {
                      if (window.innerWidth < 768 && onClose) {
                        onClose();
                      }
                      searchStore.setSelectedRunestone(runestone);
                    }}
                  >
                    <div className="font-semibold text-xs text-gray-800 group-hover:text-primary transition-colors">
                      {runestone.signature_text}
                    </div>
                    <div className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">
                      {runestone.found_location}, {runestone.parish}
                    </div>
                  </button>
                ))}
                {searchStore.resultCount > 10 && (
                  <div className="text-[10px] text-gray-400 text-center py-2 font-medium bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    Showing first 10 of {searchStore.resultCount} results
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-4 font-medium bg-gray-50/30 rounded-xl border border-dashed border-gray-100">
              No runestones found
            </div>
          )}
        </div>
      )}
    </div>
  );
});
