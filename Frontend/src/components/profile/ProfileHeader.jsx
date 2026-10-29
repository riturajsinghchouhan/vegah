import { Bell, Settings } from "lucide-react";

const ProfileHeader = () => {
  return (
    <div className="flex items-center justify-between px-5 pt-8 pb-4">
      <div>
        <h1 className="text-[22px] font-bold text-app-text tracking-tight">My Profile</h1>
        <p className="text-[12px] text-app-subtle font-medium mt-0.5">Manage your account and preferences</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-app-muted active:scale-95 transition-all text-app-text">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#2E7BE0] border-2 border-[#1B2531] rounded-full"></span>
        </button>
        <button className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-app-muted active:scale-95 transition-all text-app-text">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
