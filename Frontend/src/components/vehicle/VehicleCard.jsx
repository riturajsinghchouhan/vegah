import { Heart, User } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

const VehicleCard = ({ vehicle }) => (
  <Link className="block bg-white rounded-[16px] border border-gray-100 shadow-sm p-3 hover:border-gray-200 transition-colors relative" to={`/user/vehicles/${vehicle.id}`}>
    
    <button className="absolute top-3 right-3 z-10" type="button" onClick={(e) => e.preventDefault()}>
      <Heart size={16} className="text-gray-400 hover:text-[#FF5500] transition-colors" />
    </button>
    
    <div className="h-[90px] mb-3 flex items-center justify-center">
      <img alt={vehicle.name} className="h-full object-contain mix-blend-multiply" src={vehicle.image} />
    </div>

    <div>
      <h3 className="text-xs font-bold text-gray-900 mb-1 truncate">{vehicle.name}</h3>
      <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mb-2">
        <User size={10} />
        <span>{vehicle.seats || 4} Seats</span>
        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
        <span>{vehicle.transmission || 'Manual'}</span>
      </div>
      <p className="text-[14px] font-bold text-[#FF5500]">
        {formatCurrency(vehicle.prices.day).replace('.00', '')}
        <span className="text-[10px] text-gray-400 font-medium">/day</span>
      </p>
    </div>
  </Link>
);

export default VehicleCard;
