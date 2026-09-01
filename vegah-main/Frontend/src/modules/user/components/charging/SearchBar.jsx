import { Search, SlidersHorizontal } from "lucide-react";

const SearchBar = ({ onFilterClick }) => {
  return (
    <div className="px-5 mb-4 flex items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-[16px] px-4 py-3 shadow-sm focus-within:border-[#FF5A1F] focus-within:ring-1 focus-within:ring-[#FF5A1F] transition-all">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text"
          placeholder="Search location or station name"
          className="flex-1 bg-transparent text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Filter Button */}
      <button 
        onClick={onFilterClick}
        className="flex items-center justify-center gap-2 bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/20 rounded-[16px] px-4 py-3 shadow-sm hover:bg-[#FFE5DB] active:scale-95 transition-all shrink-0"
      >
        <SlidersHorizontal size={16} strokeWidth={2.5} />
        <span className="text-[13px] font-bold">Filters</span>
      </button>
    </div>
  );
};

export default SearchBar;
