import { Calendar, MapPin, ArrowRight, Zap, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../../../../components/common/EmptyState";
import { bookingTabs } from "../../../../constants/options";
import { formatCurrency } from "../../../../utils/formatters";
import { bookingService } from "../../../../services/bookingService";
import { initSocket } from "../../../../services/socketService";

const BookingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.listBookings();
      setUserBookings(data || []);
    } catch (err) {
      console.error("Failed to fetch user bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const socket = initSocket();
    const handleStatusUpdated = (updatedBooking) => {
      const targetId = updatedBooking._id || updatedBooking.id;
      setUserBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === targetId ? { ...b, ...updatedBooking } : b))
      );
    };

    socket.on("BOOKING_STATUS_UPDATED", handleStatusUpdated);
    return () => {
      socket.off("BOOKING_STATUS_UPDATED", handleStatusUpdated);
    };
  }, []);

  const formattedList = useMemo(() => {
    return userBookings.map((b) => {
      const st = (b.status || 'RESERVED').toUpperCase();
      let tabCategory = 'Upcoming';
      if (st === 'ACTIVE' || st === 'OVERDUE') tabCategory = 'Active';
      else if (st === 'COMPLETED') tabCategory = 'Completed';
      else if (st.includes('CANCELLED')) tabCategory = 'Cancelled';

      return {
        raw: b,
        id: b.bookingId || (typeof b._id === 'string' ? b._id.substring(0, 10).toUpperCase() : 'EVR-NEW'),
        vehicleName: b.vehicle?.name || 'EV Scooter',
        status: st,
        tabCategory,
        amount: b.totalAmount ?? b.amount ?? 0,
        dateRange: b.startDate ? `${new Date(b.startDate).toLocaleDateString()} at ${b.startTime || '10:00'}` : 'Today',
        location: b.pickupLocation || 'Main Hub',
      };
    });
  }, [userBookings]);

  const filteredBookings = useMemo(
    () => formattedList.filter((b) => b.tabCategory.toLowerCase() === activeTab.toLowerCase()),
    [formattedList, activeTab]
  );

  const handleStartRide = async (bookingId) => {
    try {
      await bookingService.startRide(bookingId);
      navigate("/user/rental/active");
    } catch (err) {
      console.error("Failed to start ride:", err);
      navigate("/user/rental/active");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE": return <Zap size={14} className="text-blue-500" />;
      case "CONFIRMED": return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "COMPLETED": return <CheckCircle2 size={14} className="text-green-500" />;
      case "CANCELLED_BY_USER":
      case "CANCELLED_BY_ADMIN":
      case "CANCELLED": return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-amber-500" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-blue-50 text-blue-600 border-blue-100";
      case "CONFIRMED": return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
      case "COMPLETED": return "bg-green-50 text-green-600 border-green-100";
      case "CANCELLED_BY_USER":
      case "CANCELLED_BY_ADMIN":
      case "CANCELLED": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  const formatStatusLabel = (status) => {
    if (status === 'CONFIRMED') return 'Approved by Admin';
    if (status === 'PENDING_VERIFICATION' || status === 'RESERVED') return 'Waiting Approval';
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 font-sans relative">
      {/* Header Section */}
      <div className="bg-white px-5 pt-8 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative z-10">
        <h1 className="text-[24px] font-bold text-gray-900 leading-tight">My Bookings</h1>
        <p className="text-[13px] text-gray-500 mt-1">Track your upcoming and past EV rides</p>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar mt-6">
          {bookingTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab 
                  ? "bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500 font-semibold">Loading your bookings...</div>
        ) : filteredBookings.length ? (
          <div className="space-y-4 mt-2">
            {filteredBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 overflow-hidden relative"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1">
                      ID: {booking.id}
                    </p>
                    <h2 className="text-[16px] font-bold text-gray-900">{booking.vehicleName}</h2>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${getStatusBadgeColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {formatStatusLabel(booking.status)}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-3 bg-[#F8F9FA] rounded-xl p-3 mb-4">
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500">Date & Time</p>
                      <p className="text-[12px] font-semibold text-gray-800 leading-snug">
                        {booking.dateRange}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-[#FF5A1F] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500">Pickup & Drop-off</p>
                      <p className="text-[12px] font-semibold text-gray-800 leading-snug">
                        {booking.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500">Total Amount</p>
                    <p className="text-[16px] font-bold text-gray-900">
                      {formatCurrency(booking.amount).replace('.00', '')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === "CONFIRMED" && (
                      <button 
                        onClick={() => handleStartRide(booking.raw._id || booking.raw.id)}
                        className="px-4 py-2 flex items-center gap-1.5 text-[12px] font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md animate-pulse"
                      >
                        <Zap size={14} /> Start Ride
                      </button>
                    )}
                    {booking.status === "ACTIVE" && (
                      <Link 
                        to="/user/rental/active" 
                        className="px-4 py-2 flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#FF5A1F] rounded-xl hover:bg-[#E54D15] transition-colors shadow-sm"
                      >
                        Track Ride <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              actionLabel="Explore vehicles"
              description="You don't have any bookings in this tab yet. Reserve an EV to get started."
              onAction={() => window.location.href = "/user/vehicles"}
              title="No bookings found"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
