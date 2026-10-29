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
                  ? "bg-app-muted border-[#2E7BE0] text-[#2E7BE0] font-bold" 
                  : "bg-app-card border-app-border text-app-text font-medium hover:bg-app-muted active:bg-app-muted"
              }`}
            >
              <Icon 
                size={14} 
                className={isActive ? "text-[#2E7BE0]" : (filter.iconColor || "text-app-subtle")}
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
