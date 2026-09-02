import { Activity, BatteryCharging, Cable, LayoutGrid, Zap } from "lucide-react";

const filterOptions = [
  { id: "all", label: "All Stations", icon: LayoutGrid },
  { id: "dc-fast", label: "DC Fast", icon: Zap },
  { id: "ac", label: "AC", icon: Activity },
  { id: "available", label: "Available Now", icon: BatteryCharging, iconColor: "text-[#16A34A]" },
  { id: "my-plug", label: "My Plug Type", icon: Cable }
];

const ChargingFilterChips = ({ activeFilter, setActiveFilter }) => {
  return (
    <div className="overflow-x-auto no-scrollbar scroll-smooth pl-5 pb-5">
      <div className="flex items-center gap-2 w-max pr-5">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id;
          const Icon = filter.icon;
          
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                isActive 
                  ? "bg-[#FFF0EB] border-[#FF5A1F] text-[#FF5A1F] font-bold" 
                  : "bg-white border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              <Icon 
                size={14} 
                className={isActive ? "text-[#FF5A1F]" : (filter.iconColor || "text-gray-500")}
              />
              <span className="text-[12px] whitespace-nowrap">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChargingFilterChips;
