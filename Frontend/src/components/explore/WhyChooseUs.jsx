import { CheckCircle, Headphones, IndianRupee, Shield } from "lucide-react";

const iconMap = {
  "shield": Shield,
  "indian-rupee": IndianRupee,
  "headphones": Headphones,
  "check-circle": CheckCircle
};

const WhyChooseUs = ({ benefits }) => {
  if (!benefits || benefits.length === 0) return null;

  return (
    <div className="px-4 mb-8">
      <h2 className="text-[17px] font-bold text-gray-900 mb-4">Why Choose Us</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {benefits.map((benefit) => {
          const Icon = iconMap[benefit.icon] || Shield;
          
          return (
            <div 
              key={benefit.id} 
              className={`rounded-[20px] p-4 border border-gray-100/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${benefit.bgColor}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 ${benefit.color}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h4 className={`text-[12px] font-bold mb-1.5 ${benefit.color}`}>{benefit.title}</h4>
                <p className="text-[9px] text-gray-500 leading-snug max-w-[120px]">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WhyChooseUs;
