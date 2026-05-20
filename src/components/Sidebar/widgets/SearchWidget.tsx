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
      <div className="relative">
        <input
          type="text"
          placeholder="Search runestones..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className="w-full h-12 px-3 pr-16 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searchStore.isLoading}
          className={`absolute right-0 top-0 bottom-0 flex items-center justify-center px-4 font-medium ${searchStore.isLoading ? 'opacity-50' : ''}`}
        >
          {searchStore.isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          ) : (
            <span className="text-primary">Search</span>
          )}
        </button>
      </div>

      {/* Search Results */}
      {searchStore.hasSearched && (
        <div className="mt-4">
          {searchStore.isLoading ? (
            <div className="text-sm text-gray-500 text-center py-2">Searching...</div>
          ) : searchStore.hasResults ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                Found {searchStore.resultCount} result{searchStore.resultCount !== 1 ? 's' : ''}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchStore.searchResults.slice(0, 10).map((runestone) => (
                  <button
                    key={runestone.id}
                    type="button"
                    className="w-full text-left p-3 bg-gray-50 rounded mb-1 hover:bg-gray-100 transition-colors flex flex-col justify-center min-h-[48px]"
                    onClick={() => {
                      if (window.innerWidth < 768 && onClose) {
                        onClose();
                      }
                      searchStore.setSelectedRunestone(runestone);
                    }}
                  >
                    <div className="font-medium text-sm">{runestone.signature_text}</div>
                    <div className="text-xs text-gray-500">
                      {runestone.found_location}, {runestone.parish}
                    </div>
                  </button>
                ))}
                {searchStore.resultCount > 10 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    Showing first 10 of {searchStore.resultCount} results
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-2">No runestones found</div>
          )}
        </div>
      )}
    </div>
  );
});
