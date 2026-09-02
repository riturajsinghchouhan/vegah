import { CarFront, CheckCircle2, Eye, EyeOff, Heart } from "lucide-react";
import { useState } from "react";

const WalletSummary = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="px-5 mb-8">
      <div className="bg-[#1C2028] rounded-[24px] overflow-hidden relative shadow-lg text-white">
        
        {/* Decorative pattern (abstract wave using radial gradients) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 100% 50%, #FF5A1F 0%, transparent 50%), radial-gradient(circle at 80% 100%, #FF5A1F 0%, transparent 40%)' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none border-l border-white/5 skew-x-[-15deg] translate-x-4"></div>

        <div className="relative z-10 flex p-5 gap-5">
          
          {/* Wallet Section */}
          <div className="w-[120px] shrink-0">
            <p className="text-[10px] text-gray-400 mb-1">Wallet Balance</p>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[20px] font-bold tracking-tight">
                {showBalance ? `₹${user.walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '••••••'}
              </h3>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <button className="border border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white text-[10px] font-bold px-4 py-1.5 rounded-full transition-all active:scale-95">
              Add Money
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] bg-white/10 my-1"></div>

          {/* Stats Section */}
          <div className="flex-1 flex justify-between items-center px-1">
            
            <div className="flex flex-col gap-2">
              <p className="text-[9px] text-gray-400">Total Bookings</p>
              <p className="text-[18px] font-bold leading-none">{user.totalBookings}</p>
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                <CarFront size={11} strokeWidth={2} />
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/10"></div>

            <div className="flex flex-col gap-2">
              <p className="text-[9px] text-gray-400">Completed Trips</p>
              <p className="text-[18px] font-bold leading-none">{user.completedTrips}</p>
              <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center justify-center text-[#16A34A]">
                <CheckCircle2 size={11} strokeWidth={2} />
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/10"></div>

            <div className="flex flex-col gap-2">
              <p className="text-[9px] text-gray-400">Saved Scoots</p>
              <p className="text-[18px] font-bold leading-none">{user.savedCars}</p>
              <div className="w-6 h-6 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 flex items-center justify-center text-[#FF5A1F]">
                <Heart size={11} strokeWidth={2} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default WalletSummary;
