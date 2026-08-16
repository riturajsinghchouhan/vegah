import { ArrowLeft, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ExploreHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-4 bg-app sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-100 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Explore More</h1>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Find the perfect car for your journey</p>
        </div>
      </div>
      <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-100 shadow-sm active:scale-95 transition-transform">
        <Heart size={18} className="text-gray-800" />
      </button>
    </div>
  );
};

export default ExploreHeader;
