import { Search, SlidersHorizontal } from "lucide-react";

const SearchBar = ({ onFilterClick }) => {
  return (
    <div className="px-5 mb-4 flex items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 flex items-center gap-2 bg-app-card border border-app-border rounded-[16px] px-4 py-3 shadow-sm focus-within:border-[#2E7BE0] focus-within:ring-1 focus-within:ring-[#2E7BE0] transition-all">
        <Search size={18} className="text-app-subtle" />
        <input 
          type="text"
          placeholder="Search location or station name"
          className="flex-1 bg-transparent text-[13px] font-medium text-app-text placeholder:text-app-subtle focus:outline-none"
        />
      </div>

      {/* Filter Button */}
      <button 
        onClick={onFilterClick}
        className="flex items-center justify-center gap-2 bg-app-muted text-[#D1FF42] border border-[#2E7BE0]/20 rounded-[16px] px-4 py-3 shadow-sm hover:bg-[#3A2418] active:scale-95 transition-all shrink-0"
      >
        <SlidersHorizontal size={16} strokeWidth={2.5} />
        <span className="text-[13px] font-bold">Filters</span>
      </button>
    </div>
  );
};

export default SearchBar;
