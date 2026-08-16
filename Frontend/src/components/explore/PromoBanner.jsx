import { ArrowRight } from "lucide-react";

const PromoBanner = () => {
  return (
    <div className="px-4 mb-8">
      <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-r from-[#FFF5F0] to-[#FFE8E0] border border-[#FFE8E0] p-6 shadow-sm min-h-[200px] flex items-center">
        
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
        
        <div className="relative z-10 w-3/5">
          <div className="inline-block bg-[#FF5A1F]/10 text-[#FF5A1F] text-[9px] font-bold px-2.5 py-1 rounded-md mb-3 tracking-wide">
            LIMITED TIME OFFER
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight mb-1">
            Get Up to <span className="text-[#FF5A1F]">30% OFF</span>
          </h2>
          <h3 className="text-[15px] font-bold text-gray-900 mb-2">
            on your first booking
          </h3>
          <p className="text-[10px] text-gray-500 mb-5">
            Offer valid for a limited time only
          </p>
          
          <button className="bg-[#FF5A1F] text-white text-[12px] font-bold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(255,90,31,0.3)] hover:bg-[#E64D00] active:scale-95 transition-all flex items-center gap-1.5 w-fit">
            Book Now <ArrowRight size={14} />
          </button>
        </div>

        {/* Car Image Area */}
        <div className="absolute right-[-20px] bottom-0 w-[55%] h-full flex items-end justify-end pointer-events-none">
          <img 
            src="https://freepngimg.com/thumb/car/4-2-car-png-picture.png" 
            alt="Promo Car" 
            className="w-full object-contain object-bottom scale-110 translate-y-2 origin-bottom drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
