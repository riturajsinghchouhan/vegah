import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
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
import { accountSettings, preferences, quickActions } from "../../../../data/profileData";
import { useAuth } from "../../../../hooks/useAuth";
import { env } from "../../../../config/env";
import { bookingService } from "../../../../services/bookingService";

// Backend base URL (strip "/api" suffix if present)
const BACKEND_BASE = env.apiUrl.replace(/\/api\/?$/, "");

// Resolve a potentially relative image path to an absolute URL
const resolveImageUrl = (url) => {
  if (!url) return "/assets/category/image.png";
  if (url.startsWith("http")) return url;          // already absolute (Cloudinary, etc.)
  if (url.startsWith("/")) return `${BACKEND_BASE}${url}`; // e.g. /uploads/file.jpg
  return `${BACKEND_BASE}/${url}`;
};

// Map backend booking status to display-friendly status
const mapStatus = (status) => {
  switch (status) {
    case "CONFIRMED":
    case "RESERVED":
    case "PENDING_VERIFICATION":
    case "PAYMENT_INITIATED":
      return "Upcoming";
    case "ACTIVE":
    case "OVERDUE":
      return "Active";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED_BY_USER":
    case "CANCELLED_BY_ADMIN":
    case "CANCELLED_BY_SYSTEM":
    case "PAYMENT_FAILED":
    case "RESERVATION_EXPIRED":
      return "Cancelled";
    default:
      return status;
  }
};

// Map a backend booking object to the shape BookingSummary expects
const mapBooking = (b) => {
  const vehicle = b.vehicle || {};
  const startDate = b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const endDate = b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : "";

  return {
    id: b.bookingId || b._id || b.id,
    status: mapStatus(b.status),
    carName: vehicle.name || "Vehicle",
    carImage: (() => {
      if (!vehicle.images || vehicle.images.length === 0) return "/assets/category/image.png";
      const primary = vehicle.images.find((img) => img.isPrimary);
      const rawUrl = primary?.url || vehicle.images[0]?.url;
      return resolveImageUrl(rawUrl);
    })(),
    dateRange,
    pickup: b.pickupLocation || "N/A",
    amount: b.totalAmount ?? b.amount ?? 0,
  };
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState(null);
  const [bookingStats, setBookingStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookings = await bookingService.listBookings({ limit: 50 });
        if (bookings && bookings.length > 0) {
          setLatestBooking(mapBooking(bookings[0]));
          const completed = bookings.filter((b) => b.status === "COMPLETED").length;
          setBookingStats({ total: bookings.length, completed });
        }
      } catch (err) {
        console.error("Failed to fetch bookings for profile:", err);
      }
    };
    fetchBookings();
  }, []);

  const handleLogout = async () => {
    setIsLogoutOpen(false);
    await logout();
    navigate("/user/login", { replace: true });
  };

  const mappedUser = {
    name: user?.fullName || "Guest",
    membership: user?.membership === "premium" ? "Premium Member" : "Standard Member",
    phone: user?.phone || "N/A",
    email: user?.email || "No email added",
    location: "Indore, Madhya Pradesh",
    avatar: user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.fullName || "Guest"}&background=FF5A1F&color=fff`,
    walletBalance: 0,
    totalBookings: bookingStats.total,
    completedTrips: bookingStats.completed,
    savedCars: 0,
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-28 font-sans">
      <ProfileHeader />
      
      <ProfileHero user={mappedUser} />
      
      <WalletSummary user={mappedUser} />
      
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
