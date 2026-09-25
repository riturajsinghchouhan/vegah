import { ArrowRight, Cable, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const ChargingStationCard = ({ station = {} }) => {
  const [imgError, setImgError] = useState(false);

  const rawStatus = (station.status || station.openStatus || "AVAILABLE").toUpperCase();
  const isAvailable = rawStatus.includes("AVAIL") || rawStatus.includes("OPEN");
  const isBusy = rawStatus.includes("BUSY") || rawStatus.includes("FULL");

  const statusLabel = isAvailable ? "Available" : isBusy ? "Busy" : "Unavailable";
  const statusColor = isAvailable ? "text-emerald-600" : isBusy ? "text-amber-500" : "text-red-500";
  const statusBg = isAvailable ? "bg-emerald-500" : isBusy ? "bg-amber-500" : "bg-red-500";

  const rawPrice = Number(station.pricePerKwh || station.price);
  const price = (rawPrice > 0 ? rawPrice : 18.0).toFixed(2);
  const availablePorts = station.availablePorts ?? station.availableChargers ?? 0;
  const totalPorts = station.totalPorts ?? station.totalChargers ?? 0;
  const distance = station.distance ?? station.distanceKm ?? 0;
  const stationId = station.id || station._id;

  return (
    <Link 
      to={stationId ? `/charging/${stationId}` : "#"}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow mb-3 block"
    >
      {/* Left: Image / Icon Container */}
      <div className="w-20 h-24 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center p-2 overflow-hidden relative">
        {station.image && !imgError ? (
          <img 
            src={station.image} 
            alt={station.name || "Charging Station"} 
            className="w-full h-full object-contain" 
            onError={() => setImgError(true)}
          />
        ) : (
          <Zap size={28} className="text-orange-500" />
        )}
      </div>

      {/* Main Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        
        {/* Header: Title, Address, Distance & Status */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{station.name || "Charging Station"}</h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{station.address || "Bengaluru, Karnataka"}</p>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-gray-500 font-medium">{distance} km</span>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${statusColor}`}>
              <span className={`w-2 h-2 rounded-full ${statusBg}`} />
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Footer: Service Chips, Price & Ports Availability */}
        <div className="flex justify-between items-end mt-3 gap-2 flex-wrap sm:flex-nowrap">
          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            {station.chargingType && (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-700">
                {station.chargingType === "AC" ? <Cable size={12} className="text-indigo-600" /> : <Zap size={12} className="text-orange-500" />}
                <span className="text-[10px] font-bold">{station.chargingType}</span>
              </div>
            )}
            {station.connector && (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-700">
                <Cable size={12} className="text-gray-400" />
                <span className="text-[10px] font-bold">{station.connector}</span>
              </div>
            )}
          </div>

          {/* Price & Port Indicator */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 leading-none">
                ₹{price}<span className="text-[10px] text-gray-500 font-normal">/kWh</span>
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-indigo-950 text-indigo-950 flex items-center justify-center hover:bg-indigo-50 transition-colors mb-0.5">
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] text-gray-500 font-medium leading-none text-center">
                {availablePorts}/{totalPorts} Available
              </p>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ChargingStationCard;
