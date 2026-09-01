import { BadgePercent, Calendar, CreditCard, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap = {
  "calendar": Calendar,
  "credit-card": CreditCard,
  "badge-percent": BadgePercent,
  "heart": Heart
};

const QuickActions = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="px-5 mb-4">
        <h2 className="text-[17px] font-bold text-gray-900">Quick Actions</h2>
      </div>
      
      <div className="overflow-x-auto no-scrollbar scroll-smooth pl-5 pb-2">
        <div className="flex items-center gap-3 w-max pr-5">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] || Calendar;
            
            return (
              <Link 
                key={action.id} 
                to={`/${action.id}`}
                className={`w-[110px] h-[100px] rounded-[20px] flex flex-col items-center justify-center p-3 transition-transform hover:-translate-y-0.5 active:scale-95 shadow-sm border border-gray-50 ${action.bg}`}
              >
                <div className={`mb-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${action.color}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
