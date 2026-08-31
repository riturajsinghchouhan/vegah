import { X } from "lucide-react";
import { useState } from "react";
import { filterOptions } from "../../../../data/exploreData";

const FilterBottomSheet = ({ isOpen, onClose, onApply }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    carType: [],
    transmission: [],
    fuel: [],
    seats: [],
    price: [],
    features: []
  });

  if (!isOpen) return null;

  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const resetFilters = () => {
    setSelectedFilters({
      carType: [],
      transmission: [],
      fuel: [],
      seats: [],
      price: [],
      features: []
    });
  };

  const handleApply = () => {
    onApply(selectedFilters);
    onClose();
  };

  const getSectionLabel = (key) => {
    if (key === "carType") return "Scoot Type";
    return key.replace(/([A-Z])/g, " $1").trim();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[24px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[17px] font-bold text-gray-900">Filters</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key}>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3 capitalize">
                {getSectionLabel(key)}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {options.map((option) => {
                  const isSelected = selectedFilters[key].includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleFilter(key, option)}
                      className={`px-4 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border ${
                        isSelected 
                          ? "bg-[#FFF0EB] border-[#FF5A1F] text-[#FF5A1F]" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white shrink-0 pb-safe">
          <button 
            onClick={resetFilters}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[14px] active:scale-95 transition-all"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex-[2] py-3.5 rounded-xl bg-[#FF5A1F] text-white font-bold text-[14px] shadow-[0_4px_12px_rgba(255,90,31,0.3)] hover:bg-[#E64D00] active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterBottomSheet;
