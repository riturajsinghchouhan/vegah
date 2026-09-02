import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Eye, Phone, Clock, StopCircle, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---

const mockLiveRentals = [
  {
    id: 'BK-10042',
    user: { name: 'Rahul Sharma', phone: '+91 9876543210' },
    scooty: { name: 'Ather 450X', reg: 'MH-12-AB-1234' },
    pickup: { location: 'Downtown Core', time: '10:30 AM, Today' },
    expectedReturn: '06:30 PM, Today',
    actualReturn: '-',
    duration: '8 Hours',
    financials: { amount: '₹400', deposit: '₹1000', status: 'Paid' },
    rentalStatus: 'Active',
    timeRemaining: '2h 15m'
  },
  {
    id: 'BK-10043',
    user: { name: 'Sneha Patel', phone: '+91 9123456780' },
    scooty: { name: 'Ola S1 Pro', reg: 'MH-12-AB-1235' },
    pickup: { location: 'University Campus', time: '09:00 AM, Today' },
    expectedReturn: '09:00 PM, Today',
    actualReturn: '-',
    duration: '12 Hours',
    financials: { amount: '₹600', deposit: '₹1000', status: 'Pending' },
    rentalStatus: 'Active',
    timeRemaining: '4h 45m'
  },
  {
    id: 'BK-10044',
    user: { name: 'Amit Kumar', phone: '+91 9988776655' },
    scooty: { name: 'Hero Optima', reg: 'MH-12-AB-1236' },
    pickup: { location: 'Tech Park', time: '02:00 PM, Yesterday' },
    expectedReturn: '02:00 PM, Today',
    actualReturn: '-',
    duration: '24 Hours',
    financials: { amount: '₹800', deposit: '₹500', status: 'Paid' },
    rentalStatus: 'Overdue',
    timeRemaining: '-1h 30m'
  }
];

const mockPickups = [
  {
    id: 'BK-10050',
    user: { name: 'Vikram Singh', phone: '+91 9876500001' },
    scooty: { name: 'Ather 450X', reg: 'Unassigned' },
    pickup: { date: 'Today', time: '04:00 PM', location: 'Downtown Core' },
    financials: { amount: '₹500', depositStatus: 'Pending', paymentStatus: 'Paid' },
    bookingStatus: 'Confirmed'
  },
  {
    id: 'BK-10051',
    user: { name: 'Priya Desai', phone: '+91 9876500002' },
    scooty: { name: 'Ola S1 Pro', reg: 'Unassigned' },
    pickup: { date: 'Tomorrow', time: '10:00 AM', location: 'University Campus' },
    financials: { amount: '₹1200', depositStatus: 'Paid', paymentStatus: 'Paid' },
    bookingStatus: 'Pending'
  },
  {
    id: 'BK-10052',
    user: { name: 'Rajesh Kumar', phone: '+91 9876500003' },
    scooty: { name: 'Hero Optima', reg: 'MH-12-AB-1299' },
    pickup: { date: 'This Week', time: '08:00 AM', location: 'Tech Park' },
    financials: { amount: '₹800', depositStatus: 'Paid', paymentStatus: 'Pending' },
    bookingStatus: 'Confirmed'
  }
];

// --- COMPONENTS ---

export default function AdminBookings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ops = searchParams.get('ops');
  
  const isLive = ops === 'live';
  const isPickups = ops === 'pickups';
  
  // Default to live if no ops or invalid ops
  const activeTab = isPickups ? 'pickups' : 'live';

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <PageHeader 
        title={activeTab === 'live' ? "Live Rentals" : "Upcoming Pickups"}
        description={activeTab === 'live' 
          ? "Monitor scooties that are currently rented out." 
          : "Future me pickup hone wali bookings."}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-700">
              <Filter size={16} /> Filters
            </Button>
          </div>
        }
      />
      
      {/* Conditionally render the correct table */}
      {activeTab === 'live' && <LiveRentalsTable navigate={navigate} />}
      {activeTab === 'pickups' && <UpcomingPickupsTable navigate={navigate} />}
      
    </div>
  );
}

// --- LIVE RENTALS TABLE ---
function LiveRentalsTable({ navigate }) {
  const [selectedRental, setSelectedRental] = useState(null);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by Booking ID, User Name, or Phone..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold divide-x divide-gray-200">
              <th className="px-6 py-4">Booking Info</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Timing & Location</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockLiveRentals.map((rental) => (
              <tr key={rental.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-gray-200">
                {/* Booking Info */}
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{rental.id}</div>
                  <div className="mt-1">
                    <StatusBadge status={rental.rentalStatus} />
                  </div>
                </td>
                {/* Customer Info */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{rental.user.name}</div>
                  <div className="text-sm text-gray-500">{rental.user.phone}</div>
                </td>
                {/* Vehicle Details */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{rental.scooty.name}</div>
                  <div className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{rental.scooty.reg}</div>
                </td>
                {/* Timing & Location */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="text-gray-500 block">Pick: {rental.pickup.time} ({rental.pickup.location})</span>
                    <span className="text-gray-500 block">Drop: {rental.expectedReturn}</span>
                    <span className={`font-semibold mt-1 block ${rental.timeRemaining.startsWith('-') ? 'text-red-600' : 'text-blue-600'}`}>
                      ⏳ {rental.timeRemaining} left
                    </span>
                  </div>
                </td>
                {/* Financials */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Amount: <span className="font-semibold">{rental.financials.amount}</span></div>
                  <div className="text-sm text-gray-500">Deposit: {rental.financials.deposit}</div>
                  <div className={`text-xs font-semibold mt-1 ${rental.financials.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                    {rental.financials.status}
                  </div>
                </td>
                {/* Actions */}
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
                    <button title="Extend Rental" className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                      <Clock size={18} />
                    </button>
                    <button title="End Rental" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <StopCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
              <div><strong className="text-gray-900">Duration:</strong> {selectedRental.duration}</div>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div><strong className="text-gray-900 block">Amount</strong> <span className="text-lg font-bold">{selectedRental.financials.amount}</span></div>
              <div className="text-right"><strong className="text-gray-900 block">Deposit</strong> {selectedRental.financials.deposit}</div>
              <div className="text-right"><strong className="text-gray-900 block">Status</strong> <StatusBadge status={selectedRental.financials.status} /></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- UPCOMING PICKUPS TABLE ---
function UpcomingPickupsTable({ navigate }) {
  const [activeFilter, setActiveFilter] = useState('Today');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const filters = ['Today', 'Tomorrow', 'This Week'];

  const filteredPickups = mockPickups.filter(p => p.pickup.date === activeFilter);

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder="Search by Booking ID, User..." 
            className="w-full bg-transparent border-none outline-none text-gray-700"
          />
        </div>

        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeFilter === filter 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold divide-x divide-gray-200">
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Pickup Timing & Location</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPickups.map((pickup) => (
              <tr key={pickup.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-gray-200">
                
                {/* Booking Info */}
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{pickup.id}</div>
                  <div className="mt-1">
                    <StatusBadge status={pickup.bookingStatus} />
                  </div>
                </td>
                
                {/* Customer Info */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{pickup.user.name}</div>
                  <div className="text-sm text-gray-500">{pickup.user.phone}</div>
                </td>
                
                {/* Vehicle Details */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{pickup.scooty.name}</div>
                  <div className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{pickup.scooty.reg}</div>
                </td>
                
                {/* Timing & Location */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 block">{pickup.pickup.date} at {pickup.pickup.time}</span>
                    <span className="text-gray-500 block mt-1 flex items-center gap-1">
                       {pickup.pickup.location}
                    </span>
                  </div>
                </td>
                
                {/* Financials */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Amt: <span className="font-semibold">{pickup.financials.amount}</span></div>
                  <div className="text-xs mt-1">
                    Dep: <span className={pickup.financials.depositStatus === 'Paid' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>{pickup.financials.depositStatus}</span>
                    <span className="mx-2">|</span>
                    Pay: <span className={pickup.financials.paymentStatus === 'Paid' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>{pickup.financials.paymentStatus}</span>
                  </div>
                </td>
                
                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      title="View Details" 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setSelectedPickup(pickup)}
                    >
                      <Eye size={18} />
                    </button>
                    <button title="Approve" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <CheckCircle size={18} />
                    </button>
                    <button title="Cancel" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <XCircle size={18} />
                    </button>
                  </div>
                </td>
                
              </tr>
            ))}
            {filteredPickups.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No pickups scheduled for {activeFilter.toLowerCase()}.
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
              <div className="text-right"><strong className="text-gray-900 block">Deposit</strong> {selectedPickup.financials.depositStatus}</div>
              <div className="text-right"><strong className="text-gray-900 block">Payment</strong> {selectedPickup.financials.paymentStatus}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
