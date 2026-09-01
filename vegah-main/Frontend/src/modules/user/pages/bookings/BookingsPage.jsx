import { Calendar, MapPin, ArrowRight, Zap, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/common/Button";
import EmptyState from "../../../../components/common/EmptyState";
import { bookingTabs } from "../../../../constants/options";
import { bookings } from "../../../../data/bookings";
import { formatCurrency } from "../../../../utils/formatters";

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState("Upcoming");

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => booking.status.toLowerCase() === activeTab.toLowerCase()),
    [activeTab]
  );

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case "active": return <Zap size={14} className="text-blue-500" />;
      case "completed": return <CheckCircle2 size={14} className="text-green-500" />;
      case "cancelled": return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-orange-500" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status.toLowerCase()) {
      case "active": return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed": return "bg-green-50 text-green-600 border-green-100";
      case "cancelled": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-orange-50 text-orange-600 border-orange-100";
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 font-sans relative">
      
      {/* Header Section */}
      <div className="bg-white px-5 pt-8 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative z-10">
        <h1 className="text-[24px] font-bold text-gray-900 leading-tight">My Bookings</h1>
        <p className="text-[13px] text-gray-500 mt-1">Track your upcoming and past rides</p>

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
        {filteredBookings.length ? (
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
                    {booking.status}
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
                    <button className="px-4 py-2 text-[12px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      Details
                    </button>
                    {booking.status === "Active" && (
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
