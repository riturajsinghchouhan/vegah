import { MessageSquareText, PhoneCall } from "lucide-react";

const SupportCard = () => {
  return (
    <div className="px-5 mb-8">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Need help?</h3>
        <p className="text-[11px] text-gray-500 mb-4">Talk to our support team anytime.</p>
        
        <div className="flex items-center gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] border border-gray-100 hover:border-gray-200 text-gray-700 text-[12px] font-bold py-2.5 rounded-xl transition-all active:scale-95">
            <MessageSquareText size={14} /> Chat
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] border border-gray-100 hover:border-gray-200 text-gray-700 text-[12px] font-bold py-2.5 rounded-xl transition-all active:scale-95">
            <PhoneCall size={14} /> Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportCard;
