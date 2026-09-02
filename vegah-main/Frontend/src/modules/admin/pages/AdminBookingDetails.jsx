import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Bike, Clock, CreditCard, Phone, CalendarClock, MapPin, StopCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import StatusBadge from '@/shared/components/admin/StatusBadge';

export default function AdminBookingDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data for the specific booking (in a real app, you'd fetch this based on the ID)
  const booking = {
    id: id || 'BK-10042',
    user: { name: 'Rahul Sharma', phone: '+91 9876543210' },
    scooty: { name: 'Ather 450X', reg: 'MH-12-AB-1234' },
    pickup: { location: 'Downtown Core', time: '10:30 AM, Today' },
    expectedReturn: '06:30 PM, Today',
    actualReturn: '-',
    duration: '8 Hours',
    financials: { amount: '₹400', deposit: '₹1000', status: 'Paid' },
    rentalStatus: 'Active',
    timeRemaining: '2h 15m'
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Booking {booking.id}</h1>
              <StatusBadge status={booking.rentalStatus} />
            </div>
            <p className="text-sm text-gray-500 mt-1">Manage rental details and actions</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-700 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-colors">
            <Phone size={16} /> Contact User
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors">
            <Clock size={16} /> Extend Rental
          </Button>
          <Button variant="primary" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 border-none text-white shadow-sm">
            <StopCircle size={16} /> End Rental
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User size={18} className="text-blue-500" /> User Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <span className="block text-sm text-gray-500 mb-1">Name</span>
              <span className="font-semibold text-gray-900 text-lg">{booking.user.name}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-1">Phone Number</span>
              <span className="font-semibold text-gray-900">{booking.user.phone}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bike size={18} className="text-orange-500" /> Vehicle Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <span className="block text-sm text-gray-500 mb-1">Scooty Model</span>
              <span className="font-semibold text-gray-900 text-lg">{booking.scooty.name}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-1">Registration Number</span>
              <span className="inline-block bg-gray-100 px-3 py-1 rounded text-sm font-semibold text-gray-700 tracking-wide">
                {booking.scooty.reg}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock size={18} className="text-purple-500" /> Rental Timeline
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-gray-500 mb-1">Pickup Date & Time</span>
                <span className="font-semibold text-gray-900">{booking.pickup.time}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500 mb-1">Pickup Location</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> {booking.pickup.location}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <span className="block text-sm text-gray-500 mb-1">Expected Return</span>
                <span className="font-semibold text-gray-900">{booking.expectedReturn}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500 mb-1">Actual Return</span>
                <span className="font-semibold text-gray-500">{booking.actualReturn}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <span className="block text-sm text-gray-500 mb-1">Rental Duration</span>
                <span className="font-semibold text-gray-900">{booking.duration}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500 mb-1">Time Remaining</span>
                <span className={`font-bold ${booking.timeRemaining.startsWith('-') ? 'text-red-600' : 'text-blue-600'}`}>
                  {booking.timeRemaining}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={18} className="text-green-500" /> Financial Summary
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Rental Amount</span>
              <span className="font-bold text-gray-900 text-lg">{booking.financials.amount}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Security Deposit</span>
              <span className="font-medium text-gray-900">{booking.financials.deposit}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600 font-medium">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                booking.financials.status === 'Paid' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {booking.financials.status}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
