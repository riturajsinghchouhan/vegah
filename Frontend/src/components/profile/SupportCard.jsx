import { MessageSquareText, PhoneCall } from "lucide-react";

const SupportCard = () => {
  return (
    <div className="px-5 mb-8">
      <div className="bg-app-card rounded-[24px] border border-app-border shadow-sm p-5">
        <h3 className="text-[15px] font-bold text-app-text mb-1">Need help?</h3>
        <p className="text-[11px] text-app-subtle mb-4">Talk to our support team anytime.</p>
        
        <div className="flex items-center gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-app-muted border border-app-border hover:border-app-border text-app-text text-[12px] font-bold py-2.5 rounded-xl transition-all active:scale-95">
            <MessageSquareText size={14} /> Chat
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-app-muted border border-app-border hover:border-app-border text-app-text text-[12px] font-bold py-2.5 rounded-xl transition-all active:scale-95">
            <PhoneCall size={14} /> Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportCard;
