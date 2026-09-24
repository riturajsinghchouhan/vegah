import { Bell, ChevronRight, CircleHelp, MapPin, ShieldCheck, User, Wallet } from "lucide-react";

const iconMap = {
  "user": User,
  "map-pin": MapPin,
  "wallet": Wallet,
  "bell": Bell,
  "circle-help": CircleHelp,
  "shield-check": ShieldCheck
};

const AccountSettings = ({ settings, onItemClick }) => {
  if (!settings || settings.length === 0) return null;

  return (
    <div className="px-5 mb-8">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        {settings.map((item, index) => {
          const Icon = iconMap[item.icon] || User;
          const isLast = index === settings.length - 1;

          return (
            <button 
              key={item.id} 
              type="button"
              onClick={() => onItemClick && onItemClick(item.id)}
              className={`w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
                !isLast ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-gray-500">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[14px] font-medium text-gray-800">
                  {item.label}
                </span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSettings;
