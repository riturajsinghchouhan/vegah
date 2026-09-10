import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Eye, Phone, Search, Filter, CheckCircle, Zap, X, Calendar, Layers } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { adminService } from '../services/adminService';
import { initSocket } from '@/services/socketService';
import { requestNotificationPermission, onForegroundMessage } from '@/config/firebase';

export default function AdminBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const ops = searchParams.get('ops');
  
  const activeTab = ops === 'live' ? 'live' : ops === 'pickups' ? 'pickups' : 'all';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio playback warning:", e);
    }
  };

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBookings();
      const bookingList = Array.isArray(data) ? data : (data?.bookings || []);
      setBookings(bookingList);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();

    // ⚡ Socket.IO Real-time Listener
    const socket = initSocket();

    const handleNewBooking = (newBooking) => {
      console.log("⚡ [Socket] NEW_BOOKING received on Admin:", newBooking);
      playNotificationSound();
      setNewBookingAlert(newBooking);

      setBookings((prev) => {
        const idToMatch = newBooking._id || newBooking.id;
        const exists = prev.some((b) => (b._id || b.id) === idToMatch);
        if (exists) return prev;
        return [newBooking, ...prev];
      });
    };

    socket.on('NEW_BOOKING', handleNewBooking);

    const handleStatusUpdated = (updatedBooking) => {
      const targetId = updatedBooking._id || updatedBooking.id;
      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === targetId ? { ...b, ...updatedBooking } : b))
      );
    };
    socket.on('BOOKING_STATUS_UPDATED', handleStatusUpdated);

    requestNotificationPermission();
    const unsubscribeFcm = onForegroundMessage((payload) => {
      console.log("🔥 [FCM] Foreground notification:", payload);
      playNotificationSound();
    });

    return () => {
      socket.off('NEW_BOOKING', handleNewBooking);
      socket.off('BOOKING_STATUS_UPDATED', handleStatusUpdated);
      unsubscribeFcm();
    };
  }, []);

  const handleApproveBooking = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      const updated = await adminService.updateBookingStatus(bookingId, 'CONFIRMED');
      
      setBookings((prev) =>
        prev.map((b) => {
          const bId = b._id || b.id;
          if (bId === bookingId) {
            return { ...b, status: 'CONFIRMED', ...(updated || {}) };
          }
          return b;
        })
      );
      alert(`✅ Booking ${updated?.bookingId || bookingId} Approved Successfully! User can now start ride.`);
    } catch (error) {
      console.error("Failed to approve booking", error);
      alert(error.response?.data?.message || "Failed to approve booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (tabKey) => {
    if (tabKey === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ ops: tabKey });
    }
  };

  const allCount = bookings.length;
  const liveCount = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'OVERDUE').length;
  const pickupsCount = bookings.filter(b => !b.status || b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'RESERVED' || b.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Bookings & Reservations"
        description="Review incoming customer bookings and click Approve to allow customers to start their EV ride."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchAllBookings} className="flex items-center gap-2 bg-white text-gray-700">
              Refresh List
            </Button>
          </div>
        }
      />
      
      {/* Live Booking Alert Banner */}
      {newBookingAlert && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between border border-emerald-500 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide">⚡ NEW BOOKING RECEIVED FOR APPROVAL!</p>
              <p className="text-xs text-emerald-100 mt-0.5">
                Booking ID: <span className="font-mono font-bold bg-emerald-700 px-1.5 py-0.5 rounded">{newBookingAlert.bookingId || newBookingAlert._id}</span> | Vehicle: <span className="font-semibold">{newBookingAlert.vehicle?.name || 'EV Scooter'}</span> | User: <span className="font-semibold">{newBookingAlert.user?.fullName || 'Customer'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setNewBookingAlert(null)}
            className="p-1.5 hover:bg-emerald-700 rounded-lg text-emerald-100 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers size={16} />
          All Bookings ({allCount})
        </button>

        <button
          onClick={() => handleTabChange('pickups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pickups'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Calendar size={16} />
          Upcoming Pickups ({pickupsCount})
        </button>

        <button
          onClick={() => handleTabChange('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'live'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Zap size={16} />
          Live Active Rentals ({liveCount})
        </button>
      </div>

      {/* Render tables */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 font-medium">Loading bookings...</div>
      ) : activeTab === 'all' ? (
        <AllBookingsTable allBookings={bookings} onApprove={handleApproveBooking} actionLoading={actionLoading} />
      ) : activeTab === 'live' ? (
        <LiveRentalsTable allBookings={bookings} />
      ) : (
        <UpcomingPickupsTable allBookings={bookings} onApprove={handleApproveBooking} actionLoading={actionLoading} />
      )}
      
    </div>
  );
}

// --- ALL BOOKINGS TABLE ---
function AllBookingsTable({ allBookings, onApprove, actionLoading }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const formattedBookings = allBookings.map(b => ({
    raw: b,
    id: b.bookingId || (typeof b._id === 'string' ? b._id.substring(0, 12).toUpperCase() : 'EVR-NEW'),
    user: { name: b.user?.fullName || 'Customer', phone: b.user?.phone || '-' },
    scooty: { name: b.vehicle?.name || 'EV Scooter', reg: b.vehicle?.registrationNumber || b.vehicle?.plateNumber || '-' },
    pickup: { 
      date: b.startDate ? new Date(b.startDate).toLocaleDateString() : (b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'),
      time: b.startTime ? (typeof b.startTime === 'string' && b.startTime.includes(':') ? b.startTime : new Date(b.startTime).toLocaleTimeString()) : '-',
      location: b.pickupLocation || b.zone?.name || 'Main Hub' 
    },
    financials: { 
      amount: `₹${b.totalAmount || b.amount || b.pricing?.total || 0}`, 
      deposit: `₹${b.securityDeposit || b.pricing?.securityDeposit || 0}`,
      status: b.depositStatus || b.paymentStatus || 'Pending' 
    },
    status: b.status || 'RESERVED'
  }));

  const searchFiltered = formattedBookings.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user.phone.includes(searchTerm) ||
    r.scooty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by Booking ID, Customer Name, Phone, or Vehicle..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800 text-sm text-white">
              <th className="px-6 py-4">Booking Info</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Pickup Timing & Location</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4 text-center">Admin Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {searchFiltered.map((item) => {
              const bId = item.raw._id || item.raw.id;
              const isNeedsApproval = item.status === 'RESERVED' || item.status === 'PENDING_VERIFICATION' || item.status === 'PAYMENT_INITIATED';
              const isApproved = item.status === 'CONFIRMED' || item.status === 'ACTIVE' || item.status === 'COMPLETED';
              const isLoadingThis = actionLoading === bId;

              return (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-gray-200">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 font-mono">{item.id}</div>
                    <div className="mt-1">
                      <StatusBadge status={item.status} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.user.name}</div>
                    <div className="text-sm text-gray-500">{item.user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.scooty.name}</div>
                    <div className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1 font-mono">{item.scooty.reg}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900 block">{item.pickup.date} at {item.pickup.time}</span>
                      <span className="text-gray-500 block mt-1">{item.pickup.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">Total: <span className="font-bold">{item.financials.amount}</span></div>
                    <div className="text-xs text-gray-500">Deposit: {item.financials.deposit}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {isNeedsApproval ? (
                        <button 
                          title="Approve Booking" 
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                          onClick={() => onApprove(bId)}
                          disabled={isLoadingThis}
                        >
                          <CheckCircle size={16} />
                          {isLoadingThis ? 'Approving...' : 'Approve Booking'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-extrabold">
                          <CheckCircle size={14} /> Approved
                        </span>
                      )}

                      <button 
                        title="View Details" 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setSelectedBooking(item)}
                      >
                        <Eye size={18} />
                      </button>
                      <button title="Contact User" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Phone size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {searchFiltered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No bookings found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        title={selectedBooking ? `Booking Details - ${selectedBooking.id}` : ''}
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4 text-base text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div><strong className="text-gray-900 block">Customer</strong> {selectedBooking.user.name} <br/> <span className="text-sm text-gray-500">{selectedBooking.user.phone}</span></div>
              <div><strong className="text-gray-900 block">Vehicle</strong> {selectedBooking.scooty.name} <br/> <span className="text-sm text-gray-500">{selectedBooking.scooty.reg}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="mb-2"><strong className="text-gray-900">Pickup:</strong> {selectedBooking.pickup.date} at {selectedBooking.pickup.time} ({selectedBooking.pickup.location})</div>
              <div><strong className="text-gray-900">Status:</strong> <StatusBadge status={selectedBooking.status} /></div>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div><strong className="text-gray-900 block">Amount</strong> <span className="text-lg font-bold">{selectedBooking.financials.amount}</span></div>
              <div className="text-right"><strong className="text-gray-900 block">Deposit</strong> {selectedBooking.financials.deposit}</div>
            </div>

            {(selectedBooking.status === 'RESERVED' || selectedBooking.status === 'PENDING_VERIFICATION' || selectedBooking.status === 'PAYMENT_INITIATED') && (
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-base shadow-lg"
                onClick={() => {
                  onApprove(selectedBooking.raw._id || selectedBooking.raw.id);
                  setSelectedBooking(null);
                }}
              >
                <CheckCircle className="mr-2" size={20} /> Approve Booking Now
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- LIVE RENTALS TABLE ---
function LiveRentalsTable({ allBookings }) {
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const liveBookings = allBookings.filter(b => 
    b.status === 'ACTIVE' || b.status === 'OVERDUE'
  ).map(b => ({
    raw: b,
    id: b.bookingId || (typeof b._id === 'string' ? b._id.substring(0, 12).toUpperCase() : 'EVR-NEW'),
    user: { name: b.user?.fullName || 'Unknown', phone: b.user?.phone || 'Unknown' },
    scooty: { name: b.vehicle?.name || 'Unknown', reg: b.vehicle?.registrationNumber || b.vehicle?.plateNumber || 'Unknown' },
    pickup: { location: b.pickupLocation || b.zone?.name || 'Unknown', time: b.startTime ? new Date(b.startTime).toLocaleString() : '-' },
    expectedReturn: b.endTime ? new Date(b.endTime).toLocaleString() : '-',
    actualReturn: b.actualReturnAt || b.actualEndTime ? new Date(b.actualReturnAt || b.actualEndTime).toLocaleString() : '-',
    duration: b.startDate && b.endDate ? `${Math.round((new Date(b.endDate) - new Date(b.startDate)) / 3600000)} Hours` : 'N/A',
    financials: { amount: `₹${b.totalAmount || b.amount || b.pricing?.total || 0}`, deposit: `₹${b.securityDeposit || b.pricing?.securityDeposit || 0}`, status: b.paymentStatus || 'Pending' },
    rentalStatus: (b.status || 'ACTIVE').replace(/_/g, ' '),
  }));

  const searchFiltered = liveBookings.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by Booking ID, User Name, or Phone..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800 text-sm text-white">
              <th className="px-6 py-4">Booking Info</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Timing & Location</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {searchFiltered.map((rental) => (
              <tr key={rental.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-gray-200">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 font-mono">{rental.id}</div>
                  <div className="mt-1">
                    <StatusBadge status={rental.rentalStatus} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{rental.user.name}</div>
                  <div className="text-sm text-gray-500">{rental.user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{rental.scooty.name}</div>
                  <div className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1 font-mono">{rental.scooty.reg}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="text-gray-500 block">Pick: {rental.pickup.time} ({rental.pickup.location})</span>
                    <span className="text-gray-500 block">Drop: {rental.expectedReturn}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Amount: <span className="font-semibold">{rental.financials.amount}</span></div>
                  <div className="text-sm text-gray-500">Deposit: {rental.financials.deposit}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      title="View Details" 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setSelectedRental(rental)}
                    >
                      <Eye size={18} />
                    </button>
                    <button title="Contact User" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Phone size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {searchFiltered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No live active rentals currently.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={!!selectedRental} 
        onClose={() => setSelectedRental(null)} 
        title={selectedRental ? `Booking Details - ${selectedRental.id}` : ''}
        size="md"
      >
        {selectedRental && (
          <div className="space-y-4 text-base text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div><strong className="text-gray-900 block">Customer</strong> {selectedRental.user.name} <br/> <span className="text-sm text-gray-500">{selectedRental.user.phone}</span></div>
              <div><strong className="text-gray-900 block">Vehicle</strong> {selectedRental.scooty.name} <br/> <span className="text-sm text-gray-500">{selectedRental.scooty.reg}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="mb-2"><strong className="text-gray-900">Pickup:</strong> {selectedRental.pickup.time} ({selectedRental.pickup.location})</div>
              <div className="mb-2"><strong className="text-gray-900">Expected Drop:</strong> {selectedRental.expectedReturn}</div>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div><strong className="text-gray-900 block">Amount</strong> <span className="text-lg font-bold">{selectedRental.financials.amount}</span></div>
              <div className="text-right"><strong className="text-gray-900 block">Deposit</strong> {selectedRental.financials.deposit}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- UPCOMING PICKUPS TABLE ---
function UpcomingPickupsTable({ allBookings, onApprove, actionLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPickup, setSelectedPickup] = useState(null);

  const upcomingBookings = allBookings.filter(b => 
    !b.status || b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'RESERVED' || b.status === 'PENDING_VERIFICATION'
  ).map(b => ({
    raw: b,
    id: b.bookingId || (typeof b._id === 'string' ? b._id.substring(0, 12).toUpperCase() : 'EVR-NEW'),
    user: { name: b.user?.fullName || 'Unknown', phone: b.user?.phone || 'Unknown' },
    scooty: { name: b.vehicle?.name || 'Unassigned', reg: b.vehicle?.registrationNumber || b.vehicle?.plateNumber || 'Unassigned' },
    pickup: { 
      date: b.startDate ? new Date(b.startDate).toLocaleDateString() : (b.startTime ? new Date(b.startTime).toLocaleDateString() : 'Today'), 
      time: b.startTime ? (typeof b.startTime === 'string' && b.startTime.includes(':') ? b.startTime : new Date(b.startTime).toLocaleTimeString()) : 'Now', 
      location: b.pickupLocation || b.zone?.name || 'Default Hub' 
    },
    financials: { 
      amount: `₹${b.totalAmount || b.amount || b.pricing?.total || 0}`, 
      depositStatus: b.depositStatus || b.paymentStatus || 'Pending', 
      paymentStatus: b.paymentStatus || 'Pending' 
    },
    bookingStatus: (b.status || 'RESERVED').replace(/_/g, ' ')
  }));

  const filteredPickups = upcomingBookings.filter(p => {
    return p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.user.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder="Search by Booking ID, User..." 
            className="w-full bg-transparent border-none outline-none text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800 text-sm text-white">
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Pickup Timing & Location</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4 text-center">Admin Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPickups.map((pickup) => {
              const bId = pickup.raw._id || pickup.raw.id;
              const isNeedsApproval = pickup.raw.status === 'RESERVED' || pickup.raw.status === 'PENDING_VERIFICATION' || pickup.raw.status === 'PAYMENT_INITIATED';
              const isLoadingThis = actionLoading === bId;

              return (
                <tr key={pickup.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-gray-200">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 font-mono">{pickup.id}</div>
                    <div className="mt-1">
                      <StatusBadge status={pickup.bookingStatus} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{pickup.user.name}</div>
                    <div className="text-sm text-gray-500">{pickup.user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{pickup.scooty.name}</div>
                    <div className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1 font-mono">{pickup.scooty.reg}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900 block">{pickup.pickup.date} at {pickup.pickup.time}</span>
                      <span className="text-gray-500 block mt-1">{pickup.pickup.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">Amt: <span className="font-semibold">{pickup.financials.amount}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {isNeedsApproval ? (
                        <button 
                          title="Approve Booking" 
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                          onClick={() => onApprove(bId)}
                          disabled={isLoadingThis}
                        >
                          <CheckCircle size={16} />
                          {isLoadingThis ? 'Approving...' : 'Approve Booking'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-extrabold">
                          <CheckCircle size={14} /> Approved
                        </span>
                      )}

                      <button 
                        title="View Details" 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setSelectedPickup(pickup)}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPickups.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No upcoming pickups scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={!!selectedPickup} 
        onClose={() => setSelectedPickup(null)} 
        title={selectedPickup ? `Pickup Details - ${selectedPickup.id}` : ''}
        size="md"
      >
        {selectedPickup && (
          <div className="space-y-4 text-base text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div><strong className="text-gray-900 block">Customer</strong> {selectedPickup.user.name} <br/> <span className="text-sm text-gray-500">{selectedPickup.user.phone}</span></div>
              <div><strong className="text-gray-900 block">Vehicle</strong> {selectedPickup.scooty.name} <br/> <span className="text-sm text-gray-500">{selectedPickup.scooty.reg}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="mb-2"><strong className="text-gray-900">Pickup Date:</strong> {selectedPickup.pickup.date} at {selectedPickup.pickup.time}</div>
              <div><strong className="text-gray-900">Location:</strong> {selectedPickup.pickup.location}</div>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div><strong className="text-gray-900 block">Amount</strong> <span className="text-lg font-bold">{selectedPickup.financials.amount}</span></div>
            </div>
            
            {(selectedPickup.raw.status === 'RESERVED' || selectedPickup.raw.status === 'PENDING_VERIFICATION' || selectedPickup.raw.status === 'PAYMENT_INITIATED') && (
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-base shadow-lg"
                onClick={() => {
                  onApprove(selectedPickup.raw._id || selectedPickup.raw.id);
                  setSelectedPickup(null);
                }}
              >
                <CheckCircle className="mr-2" size={20} /> Approve Booking Now
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
