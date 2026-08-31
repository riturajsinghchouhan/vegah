import { Bell, Settings } from "lucide-react";

const ProfileHeader = () => {
  return (
    <div className="flex items-center justify-between px-5 pt-8 pb-4">
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-[12px] text-gray-500 font-medium mt-0.5">Manage your account and preferences</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF5A1F] border-2 border-[#F8F9FA] rounded-full"></span>
        </button>
        <button className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
