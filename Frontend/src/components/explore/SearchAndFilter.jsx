import { Search, SlidersHorizontal } from "lucide-react";

const SearchAndFilter = ({ searchTerm, setSearchTerm, onOpenFilters }) => {
  return (
    <div className="px-4 mb-6 flex items-center gap-3">
      {/* Search Bar */}
      <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm focus-within:border-[#FF5A1F] focus-within:ring-1 focus-within:ring-[#FF5A1F]/20 transition-all">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by car type, brand or feature" 
          className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none w-full truncate"
        />
      </div>

      {/* Filter Button */}
      <button 
        onClick={onOpenFilters}
        className="flex items-center gap-1.5 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm hover:bg-gray-50 active:scale-95 transition-all shrink-0"
      >
        <SlidersHorizontal size={16} className="text-[#FF5A1F]" />
        <span className="text-[13px] font-bold text-[#FF5A1F]">Filters</span>
      </button>
    </div>
  );
};

export default SearchAndFilter;
