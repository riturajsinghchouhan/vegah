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
      <div className="bg-app-card rounded-[24px] border border-app-border shadow-sm overflow-hidden">
        {settings.map((item, index) => {
          const Icon = iconMap[item.icon] || User;
          const isLast = index === settings.length - 1;

          return (
            <button 
              key={item.id} 
              type="button"
              onClick={() => onItemClick && onItemClick(item.id)}
              className={`w-full flex items-center justify-between p-4 bg-app-card hover:bg-app-muted active:bg-app-muted transition-colors text-left ${
                !isLast ? "border-b border-app-border" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-app-subtle">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[14px] font-medium text-app-text">
                  {item.label}
                </span>
              </div>
              <ChevronRight size={18} className="text-app-subtle" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSettings;
