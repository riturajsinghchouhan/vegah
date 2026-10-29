import { ArrowLeft, Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChargingHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-5 pt-8 pb-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-app-border hover:bg-app-muted active:scale-95 transition-all text-app-text"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-app-text tracking-tight leading-tight">Find Battery Swapping Stations</h1>
          <p className="text-[11px] text-app-subtle font-medium mt-0.5">Find battery swapping stations near you</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-app-muted active:scale-95 transition-all text-app-text">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#2E7BE0] border-2 border-[#1B2531] rounded-full"></span>
        </button>
        <button className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-app-muted active:scale-95 transition-all text-app-text">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ChargingHeader;
