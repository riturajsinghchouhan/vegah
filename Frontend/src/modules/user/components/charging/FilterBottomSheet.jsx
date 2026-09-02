import { X } from "lucide-react";
import { useState } from "react";

const FilterSection = ({ title, options, selected, onSelect }) => (
  <div className="mb-6">
    <h3 className="text-[14px] font-bold text-gray-900 mb-3">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-full border text-[12px] transition-colors ${
            selected === opt 
              ? "bg-[#FFF0EB] border-[#FF5A1F] text-[#FF5A1F] font-bold" 
              : "bg-white border-gray-200 text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const FilterBottomSheet = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState({
    type: "DC Fast",
    connector: "CCS2",
    availability: "Available Now",
    distance: "Within 5 km",
    price: "Any Price"
  });

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-[18px] font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto no-scrollbar">
          <FilterSection 
            title="Charging Type" 
            options={["AC", "DC Fast", "Ultra Fast"]} 
            selected={filters.type}
            onSelect={(val) => setFilters({...filters, type: val})}
          />
          
          <FilterSection 
            title="Connector" 
            options={["CCS2", "Type 2", "CHAdeMO"]} 
            selected={filters.connector}
            onSelect={(val) => setFilters({...filters, connector: val})}
          />

          <FilterSection 
            title="Availability" 
            options={["Available Now", "Any Availability"]} 
            selected={filters.availability}
            onSelect={(val) => setFilters({...filters, availability: val})}
          />

          <FilterSection 
            title="Distance" 
            options={["Within 2 km", "Within 5 km", "Within 10 km", "Within 20 km"]} 
            selected={filters.distance}
            onSelect={(val) => setFilters({...filters, distance: val})}
          />

          <FilterSection 
            title="Price" 
            options={["Any Price", "Under ₹15/kWh", "₹15–₹20/kWh", "₹20+/kWh"]} 
            selected={filters.price}
            onSelect={(val) => setFilters({...filters, price: val})}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 flex items-center gap-3 bg-white">
          <button 
            onClick={() => setFilters({ type: "", connector: "", availability: "", distance: "", price: "" })}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 active:bg-gray-100 transition-all"
          >
            Reset
          </button>
          <button 
            onClick={() => onApply(filters)}
            className="flex-[2] py-3.5 rounded-xl bg-[#FF5A1F] text-white font-bold text-[14px] hover:bg-[#E64D00] shadow-[0_4px_12px_rgba(255,90,31,0.25)] active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterBottomSheet;
