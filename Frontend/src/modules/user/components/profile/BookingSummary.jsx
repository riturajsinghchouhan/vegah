import { Calendar, MapPin, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

const BookingCard = ({ booking }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "bg-green-500/20 text-green-400";
      case "Completed":
        return "bg-blue-500/20 text-blue-400";
      case "Cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-app-muted text-app-text";
    }
  };

  return (
    <div className="bg-app-card rounded-[24px] border border-app-border shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* Car Image (Left) */}
      <div className="w-[100px] shrink-0 bg-app-muted rounded-[16px] flex items-center justify-center p-2">
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
            <span className="text-[10px] text-app-subtle">Booking ID : {booking.id}</span>
            <button className="text-app-subtle hover:text-app-text transition-colors">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Middle Row: Name & Amount */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[16px] font-bold text-app-text truncate pr-2">{booking.carName}</h3>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-bold text-app-text leading-none">₹{(booking.amount ?? booking.totalAmount ?? 0).toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-app-subtle mt-0.5">Total Amount</p>
          </div>
        </div>

        {/* Bottom Row: Date, Location & Button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col gap-1.5 min-w-0 pr-2">
            <div className="flex items-start gap-1.5">
              <Calendar size={12} className="text-app-subtle mt-0.5 shrink-0" />
              <p className="text-[10px] text-app-subtle truncate">{booking.dateRange}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="text-app-subtle mt-0.5 shrink-0" />
              <div className="text-[10px] text-app-subtle truncate leading-tight">
                {booking.pickup.split(',').map((line, i) => (
                  <p key={i} className="truncate">{line.trim()}</p>
                ))}
              </div>
            </div>
          </div>
          
          <button className="shrink-0 border border-[#2E7BE0] text-[#2E7BE0] hover:bg-[#2E7BE0] hover:text-white text-[11px] font-bold px-4 py-1.5 rounded-xl transition-colors active:scale-95">
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
        <h2 className="text-[17px] font-bold text-app-text">My Bookings</h2>
        <Link 
          to="/bookings" 
          className="text-[12px] font-bold text-[#2E7BE0] flex items-center gap-1 hover:text-[#4C90EB] transition-colors"
        >
          View All <span className="text-[14px]">→</span>
        </Link>
      </div>
      <BookingCard booking={latestBooking} />
    </div>
  );
};

export default BookingSummary;
