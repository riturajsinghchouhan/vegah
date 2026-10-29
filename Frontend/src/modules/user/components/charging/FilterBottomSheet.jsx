import { X } from "lucide-react";
import { useState } from "react";

const FilterSection = ({ title, options, selected, onSelect }) => (
  <div className="mb-6">
    <h3 className="text-[14px] font-bold text-app-text mb-3">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-full border text-[12px] transition-colors ${
            selected === opt 
              ? "bg-app-muted border-[#2E7BE0] text-[#2E7BE0] font-bold" 
              : "bg-app-card border-app-border text-app-subtle font-medium hover:bg-app-muted active:bg-app-muted"
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-app-card rounded-t-[24px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-[18px] font-bold text-app-text">Filters</h2>
          <button onClick={onClose} className="p-2 bg-app-muted hover:bg-app-muted rounded-full text-app-subtle transition-colors">
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
        <div className="p-5 border-t border-app-border flex items-center gap-3 bg-app-card">
          <button 
            onClick={() => setFilters({ type: "", connector: "", availability: "", distance: "", price: "" })}
            className="flex-1 py-3.5 rounded-xl border border-app-border text-app-text font-bold text-[14px] hover:bg-app-muted active:bg-app-muted transition-all"
          >
            Reset
          </button>
          <button 
            onClick={() => onApply(filters)}
            className="flex-[2] py-3.5 rounded-xl bg-[#2E7BE0] text-white font-bold text-[14px] hover:bg-[#4C90EB] shadow-[0_4px_12px_rgba(255,90,31,0.25)] active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterBottomSheet;
