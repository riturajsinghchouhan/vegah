import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AccountSettings from "../../../../components/profile/AccountSettings";
import BookingSummary from "../../../../components/profile/BookingSummary";
import LogoutConfirmationSheet from "../../../../components/profile/LogoutConfirmationSheet";
import ProfileHeader from "../../../../components/profile/ProfileHeader";
import ProfileHero from "../../../../components/profile/ProfileHero";
import QuickActions from "../../../../components/profile/QuickActions";
import WalletSummary from "../../../../components/profile/WalletSummary";
import { accountSettings, quickActions } from "../../../../data/profileData";
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
      
      {/* Manage Details Section */}
      <div className="px-5 mb-8">
        <h3 className="text-[16px] font-bold text-gray-900 mb-3 px-1">Manage Details</h3>
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <Link 
            to="/user/profile/aadhar"
            className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="7" x2="9" y1="13" y2="13"/><line x1="7" x2="11" y1="17" y2="17"/></svg>
              </div>
              <span className="text-[14px] font-medium text-gray-800">
                Aadhar Verification
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link 
            to="/user/profile/license"
            className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M8 14h8"/></svg>
              </div>
              <span className="text-[14px] font-medium text-gray-800">
                Driving License
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
      </div>

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
