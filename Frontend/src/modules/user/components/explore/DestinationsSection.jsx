import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const DestinationsSection = ({ destinations }) => {
  if (!destinations || destinations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-[17px] font-bold text-gray-900">Top Destinations</h2>
        <Link 
          to="/explore-destinations" 
          className="text-[12px] font-bold text-[#FF5A1F] flex items-center gap-1 hover:text-[#E64D00] transition-colors"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="overflow-x-auto no-scrollbar scroll-smooth pl-4 pb-4">
        <div className="flex items-center gap-3 w-max pr-4">
          {destinations.map((destination) => (
            <Link 
              key={destination.id} 
              to={`/destination/${destination.id}`}
              className="group block relative w-[140px] h-[190px] rounded-[20px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Background Image */}
              <img 
                src={destination.image} 
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Distance Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                <MapPin size={10} className="text-[#FF5A1F]" />
                {destination.distance}
              </div>

              {/* Content */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white text-[15px] font-bold mb-0.5 drop-shadow-sm">{destination.name}</h3>
                <p className="text-white/80 text-[9px] leading-tight drop-shadow-sm">
                  {destination.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationsSection;
