import { Camera, ChevronRight, Crown, MapPin } from "lucide-react";

const ProfileHero = ({ user }) => {
  return (
    <div className="px-5 mb-8">
      <div className="flex items-center gap-4 cursor-pointer group">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-gray-50">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-600 hover:text-[#FF5A1F] active:scale-95 transition-all">
            <Camera size={13} strokeWidth={2} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h2 className="text-[18px] font-bold text-gray-900 truncate">{user.name}</h2>
            <div className="bg-[#FFF0EB] text-[#FF5A1F] flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap">
              <Crown size={10} strokeWidth={2.5} />
              {user.membership}
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <p className="text-[12px] text-gray-600 font-medium truncate">{user.phone}</p>
            <p className="text-[12px] text-gray-600 truncate">{user.email}</p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 truncate">
              <MapPin size={12} strokeWidth={2} />
              {user.location}
            </p>
          </div>
        </div>

        {/* Action Chevron */}
        <div className="shrink-0 text-gray-400 group-hover:text-[#FF5A1F] group-hover:translate-x-1 transition-all">
          <ChevronRight size={20} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
