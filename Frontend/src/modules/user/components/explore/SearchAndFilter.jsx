import { Search, SlidersHorizontal } from "lucide-react";

const SearchAndFilter = ({ searchTerm, setSearchTerm, onOpenFilters }) => {
  return (
    <div className="px-4 mb-6 flex items-center gap-3">
      {/* Search Bar */}
      <div className="flex-1 flex items-center gap-2 bg-app-card rounded-full border border-app-border px-4 py-3 shadow-sm focus-within:border-[#2E7BE0] focus-within:ring-1 focus-within:ring-[#2E7BE0]/20 transition-all">
        <Search size={18} className="text-app-subtle shrink-0" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by scoot type, brand or feature" 
          className="flex-1 bg-transparent text-[13px] text-app-text placeholder-app-subtle outline-none w-full truncate"
        />
      </div>

      {/* Filter Button */}
      <button 
        onClick={onOpenFilters}
        className="flex items-center gap-1.5 bg-app-card rounded-full border border-app-border px-4 py-3 shadow-sm hover:bg-app-muted active:scale-95 transition-all shrink-0"
      >
        <SlidersHorizontal size={16} className="text-[#2E7BE0]" />
        <span className="text-[13px] font-bold text-[#2E7BE0]">Filters</span>
      </button>
    </div>
  );
};

export default SearchAndFilter;
