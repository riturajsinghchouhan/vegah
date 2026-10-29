import { Heart, Settings2, User } from "lucide-react";
import { Link } from "react-router-dom";

const ExploreCarCard = ({ car }) => {
  return (
    <Link 
      to={`/vehicles/${car.id}`}
      className="block w-[180px] bg-app-card rounded-[20px] border border-app-border shadow-sm p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group"
    >
      <button 
        onClick={(e) => {
          e.preventDefault();
          // Toggle favourite logic here
        }}
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center bg-app-card rounded-full shadow-sm border border-app-border active:scale-90 transition-transform"
      >
        <Heart size={14} className="text-gray-300 hover:text-[#2E7BE0] transition-colors" />
      </button>

      <div className="h-[90px] mb-4 flex items-center justify-center pt-2">
        <img 
          src={car.image} 
          alt={car.name} 
          className="h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div>
        <h3 className="text-[13px] font-bold text-app-text mb-0.5 truncate">{car.name}</h3>
        <p className="text-[10px] text-app-subtle mb-3">{car.category}</p>

        <div className="flex items-center gap-3 text-[10px] text-app-subtle mb-4">
          <div className="flex items-center gap-1">
            <User size={12} className="text-app-subtle" />
            <span>{car.seats} Seats</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings2 size={12} className="text-app-subtle" />
            <span>{car.transmission}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[15px] font-bold text-[#2E7BE0] leading-none">
              ₹{car.price.toLocaleString('en-IN')}
              <span className="text-[10px] text-app-subtle font-medium ml-0.5">/ day</span>
            </p>
          </div>
          {car.discount && (
            <div className="bg-[#13301F] text-[#16A34A] text-[9px] font-bold px-2 py-1 rounded-md">
              {car.discount}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ExploreCarCard;
