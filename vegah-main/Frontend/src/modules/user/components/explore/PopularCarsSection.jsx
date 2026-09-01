import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ExploreCarCard from "./ExploreCarCard";

const PopularCarsSection = ({ cars }) => {
  if (!cars || cars.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-[17px] font-bold text-gray-900">Popular Scoots</h2>
        <Link 
          to="/vehicles" 
          className="text-[12px] font-bold text-[#FF5A1F] flex items-center gap-1 hover:text-[#E64D00] transition-colors"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="overflow-x-auto no-scrollbar scroll-smooth pl-4 pb-4">
        <div className="flex items-center gap-4 w-max pr-4">
          {cars.map((car) => (
            <ExploreCarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularCarsSection;
