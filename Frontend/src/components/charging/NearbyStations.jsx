import { ChevronDown } from "lucide-react";
import ChargingStationCard from "./ChargingStationCard";

const NearbyStations = ({ stations }) => {
  return (
    <div className="px-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-app-text leading-tight">Nearby Battery Swapping Stations</h2>
          <p className="text-[11px] text-app-subtle mt-0.5">Within 5 km radius</p>
        </div>
        
        <button className="flex items-center gap-1.5 text-[12px] text-app-subtle font-medium hover:text-app-text transition-colors">
          Sort by: <span className="text-[#D1FF42] font-bold">Distance</span>
          <ChevronDown size={14} className="text-[#D1FF42]" />
        </button>
      </div>

      <div className="flex flex-col gap-0">
        {stations.length > 0 ? (
          stations.map(station => (
            <ChargingStationCard key={station.id} station={station} />
          ))
        ) : (
          <div className="py-8 text-center bg-app-muted rounded-[20px] border border-app-border">
            <h3 className="text-[14px] font-bold text-app-text mb-1">No battery swapping stations nearby</h3>
            <p className="text-[11px] text-app-subtle">Try increasing your search radius or changing your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyStations;
