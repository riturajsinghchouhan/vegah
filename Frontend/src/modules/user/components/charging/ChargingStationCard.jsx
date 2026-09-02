import { ArrowRight, Cable, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const ChargingStationCard = ({ station }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "text-[#16A34A]";
      case "Busy":
        return "text-[#F97316]";
      case "Unavailable":
        return "text-[#DC2626]";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-[#16A34A]";
      case "Busy":
        return "bg-[#F97316]";
      case "Unavailable":
        return "bg-[#DC2626]";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Link 
      to={`/charging/${station.id}`}
      className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow mb-3 block"
    >
      {/* Left: Image */}
      <div className="w-[80px] h-[100px] shrink-0 bg-[#F8F9FA] rounded-[16px] flex items-center justify-center p-2 overflow-hidden">
        {/* Placeholder image representation, assuming they have generic ev charger images */}
        <img 
          src={station.image} 
          alt={station.name} 
          className="w-full h-full object-contain mix-blend-multiply" 
          onError={(e) => {
            // Fallback generic charging icon if image not found
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="hidden text-[#FF5A1F] opacity-50">
          <Zap size={32} />
        </div>
      </div>

      {/* Middle & Right Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        
        <div className="flex justify-between items-start gap-2">
          {/* Middle Top: Name & Address */}
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-gray-900 truncate">{station.name}</h3>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{station.address}</p>
          </div>
          
          {/* Right Top: Distance & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-gray-500 font-medium">{station.distance} km</span>
            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${getStatusColor(station.status)}`}>
              <span className={`w-2 h-2 rounded-full ${getStatusBgColor(station.status)}`}></span>
              {station.status}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-2">
          {/* Middle Bottom: Chips */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-700">
              {station.chargingType === "AC" ? (
                <Cable size={12} className="text-[#FF5A1F]" />
              ) : (
                <Zap size={12} className="text-[#FF5A1F]" />
              )}
              <span className="text-[10px] font-bold">{station.chargingType}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-700">
              <Cable size={12} className="text-gray-500" />
              <span className="text-[10px] font-bold">{station.connector}</span>
            </div>
          </div>

          {/* Right Bottom: Price, Button, Slots */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[14px] font-bold text-gray-900 leading-none">
                ₹{station.pricePerKwh.toFixed(2)}<span className="text-[11px] text-gray-500 font-medium">/kWh</span>
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-[#FF5A1F] text-[#FF5A1F] flex items-center justify-center hover:bg-[#FFF0EB] transition-colors mb-1">
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[8px] text-gray-500 font-medium leading-none text-center">
                {station.availablePorts}/{station.totalPorts}<br />Available
              </p>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ChargingStationCard;
