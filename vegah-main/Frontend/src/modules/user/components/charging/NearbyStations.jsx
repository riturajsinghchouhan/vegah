import { ChevronDown } from "lucide-react";
import ChargingStationCard from "./ChargingStationCard";

const NearbyStations = ({ stations }) => {
  return (
    <div className="px-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-gray-900 leading-tight">Nearby Battery Swapping Stations</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Within 5 km radius</p>
        </div>
        
        <button className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium hover:text-gray-800 transition-colors">
          Sort by: <span className="text-[#FF5A1F] font-bold">Distance</span>
          <ChevronDown size={14} className="text-[#FF5A1F]" />
        </button>
      </div>

      <div className="flex flex-col gap-0">
        {stations.length > 0 ? (
          stations.map(station => (
            <ChargingStationCard key={station.id} station={station} />
          ))
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-[20px] border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-900 mb-1">No battery swapping stations nearby</h3>
            <p className="text-[11px] text-gray-500">Try increasing your search radius or changing your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyStations;
