import { Gift } from "lucide-react";

const ReferEarnCard = () => {
  return (
    <div className="px-5 mb-8">
      <div className="bg-gradient-to-br from-[#FFF5F0] to-[#FFE8E0] rounded-[24px] border border-[#FFE8E0] p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
        
        {/* Background Decorative Graphic */}
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 w-[70%]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center text-[#FF5A1F]">
              <Gift size={12} strokeWidth={2.5} />
            </div>
            <h3 className="text-[14px] font-bold text-gray-900 leading-tight">
              Refer & Earn
            </h3>
          </div>
          <p className="text-[10px] text-gray-600 mb-3 leading-snug">
            Invite friends and get <span className="font-bold text-[#FF5A1F]">₹200</span> in wallet credits.
          </p>
          <button className="bg-white text-[#FF5A1F] border border-gray-100 shadow-sm text-[11px] font-bold px-4 py-1.5 rounded-full active:scale-95 transition-all w-fit hover:border-[#FF5A1F]">
            Invite Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferEarnCard;
