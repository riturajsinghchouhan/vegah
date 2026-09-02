import { Calendar, MapPin, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

const BookingCard = ({ booking }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "bg-green-100 text-green-700";
      case "Completed":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* Car Image (Left) */}
      <div className="w-[100px] shrink-0 bg-[#F8F9FA] rounded-[16px] flex items-center justify-center p-2">
        <img src={booking.carImage} alt={booking.carName} className="w-full object-contain mix-blend-multiply" />
      </div>

      {/* Details (Right) */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Top Row: Status & ID */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">Booking ID : {booking.id}</span>
            <button className="text-gray-400 hover:text-gray-700 transition-colors">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Middle Row: Name & Amount */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[16px] font-bold text-gray-900 truncate pr-2">{booking.carName}</h3>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-bold text-gray-900 leading-none">₹{booking.amount.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Total Amount</p>
          </div>
        </div>

        {/* Bottom Row: Date, Location & Button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col gap-1.5 min-w-0 pr-2">
            <div className="flex items-start gap-1.5">
              <Calendar size={12} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-gray-600 truncate">{booking.dateRange}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-[10px] text-gray-600 truncate leading-tight">
                {booking.pickup.split(',').map((line, i) => (
                  <p key={i} className="truncate">{line.trim()}</p>
                ))}
              </div>
            </div>
          </div>
          
          <button className="shrink-0 border border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white text-[11px] font-bold px-4 py-1.5 rounded-xl transition-colors active:scale-95">
            View Details
          </button>
        </div>

      </div>
    </div>
  );
};

const BookingSummary = ({ latestBooking }) => {
  if (!latestBooking) return null;

  return (
    <div className="px-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-gray-900">My Bookings</h2>
        <Link 
          to="/bookings" 
          className="text-[12px] font-bold text-[#FF5A1F] flex items-center gap-1 hover:text-[#E64D00] transition-colors"
        >
          View All <span className="text-[14px]">→</span>
        </Link>
      </div>
      <BookingCard booking={latestBooking} />
    </div>
  );
};

export default BookingSummary;
