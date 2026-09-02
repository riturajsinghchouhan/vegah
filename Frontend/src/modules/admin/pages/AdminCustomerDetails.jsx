import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, Star, ShieldCheck, FileText, Ban, Activity } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export default function AdminCustomerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const customerId = id || 'CUST-1001';

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto bg-gray-50/30 p-4 rounded-xl">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/customers')} className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Profile</h1>
            <p className="text-sm text-gray-500">Manage customer details, bookings, and transactions.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-white">
            <Ban size={16} className="mr-2" /> Block User
          </Button>
        </div>
      </div>

      {/* Profile Summary Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-4xl shrink-0 border-4 border-blue-50">
            R
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Rahul Sharma 
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                <ShieldCheck size={12} /> Verified
              </span>
            </h2>
            <div className="text-sm text-gray-500 font-medium">{customerId} • Registered 12 Jan 2024</div>
            <div className="flex items-center gap-4 text-sm text-gray-700 pt-2">
              <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400"/> rahul.sharma@example.com</span>
              <span className="flex items-center gap-1.5"><Phone size={16} className="text-gray-400"/> +91 9876543210</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0 md:border-l md:border-gray-200 md:pl-8 w-full md:w-auto">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[140px]">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Bookings</span>
            <span className="text-2xl font-black text-gray-900">12</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 min-w-[140px]">
            <span className="block text-xs font-semibold text-blue-600/80 uppercase tracking-wider mb-1">Wallet Balance</span>
            <span className="text-2xl font-black text-blue-700">₹ 450</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* KYC Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-gray-500" /> KYC & Verification
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Aadhar Number</span>
                <span className="text-sm font-semibold text-gray-900">XXXX XXXX 1234</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Driving License</span>
                <span className="text-sm font-semibold text-gray-900">MP09 20180012345</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Documents</span>
                <div className="flex gap-2">
                  <div className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold text-center rounded border border-blue-100 cursor-pointer hover:bg-blue-100">View Aadhar</div>
                  <div className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold text-center rounded border border-blue-100 cursor-pointer hover:bg-blue-100">View DL</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet & Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-gray-500" /> Wallet Transactions
              </h3>
              <span className="text-xs text-blue-600 font-bold cursor-pointer">View All</span>
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <Activity size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{i === 1 ? 'Refund Added' : 'Booking Payment'}</div>
                      <div className="text-xs text-gray-500">20 May 2025</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${i === 1 ? 'text-green-600' : 'text-gray-900'}`}>
                    {i === 1 ? '+ ₹ 500' : '- ₹ 1,200'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (2 spans wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Rental */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-bold text-sm text-green-700 flex items-center gap-2 uppercase tracking-wider">
                <Activity size={18} /> Active Rental
              </h3>
              <Button variant="outline" className="h-8 text-xs bg-white">Manage Booking</Button>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 bg-green-50/30">
               <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Booking ID</span>
                  <span className="text-sm font-bold text-blue-600">BK1025</span>
               </div>
               <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Scooty</span>
                  <span className="text-sm font-bold text-gray-900">Ola S1 Pro</span>
               </div>
               <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Pickup</span>
                  <span className="text-sm font-bold text-gray-900">20 May, 10:00 AM</span>
               </div>
               <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Expected Return</span>
                  <span className="text-sm font-bold text-gray-900">22 May, 06:00 PM</span>
               </div>
            </div>
          </div>

          {/* Booking History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" /> Booking History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold bg-gray-50/30">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Scooty</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-blue-600 font-semibold text-sm cursor-pointer hover:underline">BK102{4-i}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">Ather 450X</td>
                      <td className="px-5 py-4 text-xs text-gray-500">10 Apr - 12 Apr</td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">₹ 1,500</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews & Ratings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Star size={18} className="text-yellow-500" /> Recent Reviews Given
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} className="text-gray-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">for Booking BK102{4-i}</span>
                    <span className="text-xs text-gray-400 ml-auto">12 Apr 2024</span>
                  </div>
                  <p className="text-sm text-gray-600">Great scooty condition, really enjoyed the ride. Pickup process was very smooth!</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
