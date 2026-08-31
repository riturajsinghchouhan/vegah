import { ArrowLeft, Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChargingHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-5 pt-8 pb-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-900"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">Find Battery Swapping Stations</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Find battery swapping stations near you</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF5A1F] border-2 border-[#F8F9FA] rounded-full"></span>
        </button>
        <button className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ChargingHeader;
