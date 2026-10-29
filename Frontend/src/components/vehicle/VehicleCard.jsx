import { Heart, User } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

const VehicleCard = ({ vehicle }) => (
  <Link className="block bg-app-card rounded-[16px] border border-app-border shadow-sm p-3 hover:border-app-border transition-colors relative" to={`/user/vehicles/${vehicle.id}`}>
    
    <button className="absolute top-3 right-3 z-10" type="button" onClick={(e) => e.preventDefault()}>
      <Heart size={16} className="text-app-subtle hover:text-[#D1FF42] transition-colors" />
    </button>
    
    <div className="h-[90px] mb-3 flex items-center justify-center">
      <img alt={vehicle.name} className="h-full object-contain" src={vehicle.image} />
    </div>

    <div>
      <h3 className="text-xs font-bold text-app-text mb-1 truncate">{vehicle.name || "Unknown Scoot"}</h3>
      <div className="flex items-center gap-1.5 text-[9px] text-app-subtle mb-2">
        <User size={10} />
        <span>{vehicle.seats ? `${vehicle.seats} Seats` : '2 Seats'}</span>
        <span className="w-1 h-1 bg-app-subtle rounded-full"></span>
        <span>{vehicle.transmission || 'Auto'}</span>
      </div>
      <p className="text-[14px] font-bold text-[#D1FF42]">
        {formatCurrency(vehicle.prices.day).replace('.00', '')}
        <span className="text-[10px] text-app-subtle font-medium">/day</span>
      </p>
    </div>
  </Link>
);

export default VehicleCard;
