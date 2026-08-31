import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountSettings from "../../../../components/profile/AccountSettings";
import BookingSummary from "../../../../components/profile/BookingSummary";
import LogoutConfirmationSheet from "../../../../components/profile/LogoutConfirmationSheet";
import Preferences from "../../../../components/profile/Preferences";
import ProfileHeader from "../../../../components/profile/ProfileHeader";
import ProfileHero from "../../../../components/profile/ProfileHero";
import QuickActions from "../../../../components/profile/QuickActions";
import ReferEarnCard from "../../../../components/profile/ReferEarnCard";
import SupportCard from "../../../../components/profile/SupportCard";
import WalletSummary from "../../../../components/profile/WalletSummary";
import { accountSettings, latestBooking, preferences, quickActions, userProfile } from "../../../../data/profileData";
import { useAuth } from "../../../../hooks/useAuth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-28 font-sans">
      <ProfileHeader />
      
      <ProfileHero user={userProfile} />
      
      <WalletSummary user={userProfile} />
      
      <BookingSummary latestBooking={latestBooking} />
      
      <QuickActions actions={quickActions} />
      
      <AccountSettings settings={accountSettings} />
      
      <Preferences preferences={preferences} />
      
      <ReferEarnCard />
      
      <SupportCard />
      
      {/* Logout Button */}
      <div className="px-5 mt-2">
        <button 
          onClick={() => setIsLogoutOpen(true)}
          className="flex items-center gap-3 px-4 py-4 w-full bg-white rounded-[20px] border border-red-100 shadow-sm hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <LogOut size={20} className="text-[#DC2626]" />
          <span className="text-[14px] font-bold text-[#DC2626]">Logout</span>
        </button>
      </div>

      <LogoutConfirmationSheet 
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default ProfilePage;
