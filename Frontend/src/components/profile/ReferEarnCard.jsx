import { Gift } from "lucide-react";

const ReferEarnCard = () => {
  return (
    <div className="px-5 mb-8">
      <div className="bg-gradient-to-br from-[#FFF5F0] to-[#3A2418] rounded-[24px] border border-[#3A2418] p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
        
        {/* Background Decorative Graphic */}
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-app-card/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 w-[70%]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-[#2E7BE0]/10 flex items-center justify-center text-[#D1FF42]">
              <Gift size={12} strokeWidth={2.5} />
            </div>
            <h3 className="text-[14px] font-bold text-app-text leading-tight">
              Refer & Earn
            </h3>
          </div>
          <p className="text-[10px] text-app-subtle mb-3 leading-snug">
            Invite friends and get <span className="font-bold text-[#D1FF42]">₹200</span> in wallet credits.
          </p>
          <button className="bg-app-card text-[#D1FF42] border border-app-border shadow-sm text-[11px] font-bold px-4 py-1.5 rounded-full active:scale-95 transition-all w-fit hover:border-[#2E7BE0]">
            Invite Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferEarnCard;
