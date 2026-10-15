import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, Star, ShieldCheck, FileText, Ban, Activity, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { adminService } from '../services/adminService';

const vehicleLabel = (vehicle) =>
  vehicle?.name || [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') || 'Unknown EV';

const formatDay = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatSlot = (date, time) => [formatDay(date), time].filter(Boolean).join(', ');

export default function AdminCustomerDetails({ customerIdProp, asModal, onDeleted }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const customerId = customerIdProp || id || 'CUST-1001';
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(null); // { title, images, index }

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        // Ensure customerId is a valid DB _id, not a dummy like 'CUST-1001'
        // If it's a dummy ID because of old code, we'll try to fetch, it may fail if not an ObjectId
        const data = await adminService.getUserById(customerId);
        setCustomer(data);
        
        try {
          const userBookings = await adminService.getBookings({ userId: customerId });
          // getBookings resolves to { items, meta }, not a bare array.
          setBookings(userBookings?.items || []);
        } catch (err) {
          console.error("Failed to load customer bookings", err);
          setBookings([]);
        }

        try {
          const walletData = await adminService.getAdminUserWallet(customerId);
          setWalletTransactions(walletData.transactions || []);
        } catch (err) {
          console.error("Failed to load customer wallet transactions", err);
          setWalletTransactions([]);
        }
        
      } catch (error) {
        console.error("Failed to load customer details", error);
      } finally {
        setLoading(false);
      }
    };
    if (customerId && customerId !== 'CUST-1001') {
       fetchCustomer();
    } else {
       setLoading(false); // don't hang if it's dummy
    }
  }, [customerId]);

  const toggleBlock = async () => {
    if (!customer) return;
    try {
      if (!customer.isBlocked) {
        await adminService.blockUser(customer._id);
      } else {
        await adminService.unblockUser(customer._id);
      }
      setCustomer({ ...customer, isBlocked: !customer.isBlocked });
    } catch (error) {
      console.error("Failed to toggle block status", error);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!window.confirm(`Are you sure you want to permanently delete customer "${customer.fullName || 'User'}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleting(true);
      await adminService.deleteUser(customer._id);
      if (onDeleted) {
        onDeleted(customer._id);
      } else {
        navigate('/admin/customers');
      }
    } catch (error) {
      console.error("Failed to delete customer", error);
      alert(error.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Customer not found or invalid ID.</div>;
  }

  const kyc = customer.kyc || {};
  const activeBooking = customer.activeBooking;
  const previewImage = preview?.images?.[preview.index];

  return (
    <div className={`space-y-6 pb-8 max-w-[1400px] mx-auto bg-gray-50/30 rounded-xl ${asModal ? '' : 'p-4'}`}>
      
      {/* Top Bar */}
      {!asModal && (
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
            <Button 
              variant="outline" 
              onClick={toggleBlock}
              className={`border hover:bg-opacity-10 ${!customer.isBlocked ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'} bg-white`}
            >
              <Ban size={16} className="mr-2" /> {!customer.isBlocked ? 'Block User' : 'Unblock User'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={deleting}
              className="border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-white"
            >
              <Trash2 size={16} className="mr-2" /> {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </div>
      )}

      {/* Action Bar for Modal */}
      {asModal && (
        <div className="flex items-center justify-end gap-3 pb-3 border-b border-gray-100">
          <Button 
            variant="outline" 
            onClick={toggleBlock}
            className={`h-8 px-3 text-xs border ${!customer.isBlocked ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'} bg-white`}
          >
            <Ban size={14} className="mr-1.5" /> {!customer.isBlocked ? 'Block Customer' : 'Unblock Customer'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 px-3 text-xs border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-white"
          >
            <Trash2 size={14} className="mr-1.5" /> {deleting ? 'Deleting...' : 'Delete Customer'}
          </Button>
        </div>
      )}

      {/* Profile Summary Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-4xl shrink-0 border-4 border-blue-50 overflow-hidden">
            {customer.avatarUrl ? (
               <img src={customer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
               customer.fullName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {customer.fullName}
              {customer.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-500 font-medium">{customer._id} • Registered {new Date(customer.createdAt).toLocaleDateString()}</div>
            <div className="flex items-center gap-4 text-sm text-gray-700 pt-2">
              <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400"/> {customer.email || 'N/A'}</span>
              <span className="flex items-center gap-1.5"><Phone size={16} className="text-gray-400"/> {customer.phone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0 md:border-l md:border-gray-200 md:pl-8 w-full md:w-auto">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[140px]">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Bookings</span>
            <span className="text-2xl font-black text-gray-900">{customer.stats?.totalBookings || 0}</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 min-w-[140px]">
            <span className="block text-xs font-semibold text-blue-600/80 uppercase tracking-wider mb-1">Wallet Balance</span>
            <span className="text-2xl font-black text-blue-700">₹ {customer.walletBalance || 0}</span>
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
                <span className="text-sm font-semibold text-gray-900">{kyc.aadharNumber || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Driving License</span>
                <span className="text-sm font-semibold text-gray-900">{kyc.licenseNumber || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Documents</span>
                {/* Booking uploads are base64 data URLs, which browsers refuse to open
                    in a new tab, so documents are previewed in-page instead. */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Aadhar', title: 'Aadhar Card', images: kyc.aadharImages },
                    { label: 'DL', title: 'Driving License', images: kyc.licenseImages },
                    { label: 'Selfie', title: 'Customer Photo', images: kyc.selfieImages },
                  ].map(({ label, title, images = [] }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={images.length === 0}
                      onClick={() => setPreview({ title, images, index: 0 })}
                      className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold text-center rounded border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View {label}{images.length > 1 ? ` (${images.length})` : ''}
                    </button>
                  ))}
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
            </div>
            <div className="p-4 space-y-4">
              {walletTransactions.length > 0 ? (
                walletTransactions.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Activity size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{tx.description || tx.type}</div>
                        <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'CREDIT' ? '+ ' : '- '}₹ {tx.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500">
                  No recent wallet transactions.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (2 spans wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Rental */}
          {activeBooking ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-green-700 flex items-center gap-2 uppercase tracking-wider">
                  <Activity size={18} /> Active Rental
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">{activeBooking.status}</span>
                </h3>
                <Button
                  variant="outline"
                  className="h-8 text-xs bg-white"
                  onClick={() => navigate(`/admin/bookings/${activeBooking._id}`)}
                >
                  Manage Booking
                </Button>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 bg-green-50/30">
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Booking ID</span>
                  <span className="text-sm font-semibold text-gray-900">{activeBooking.bookingId}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Scooty</span>
                  <span className="text-sm font-semibold text-gray-900">{vehicleLabel(activeBooking.vehicle)}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Pickup</span>
                  <span className="text-sm font-semibold text-gray-900">{formatSlot(activeBooking.startDate, activeBooking.startTime)}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Return</span>
                  <span className="text-sm font-semibold text-gray-900">{formatSlot(activeBooking.endDate, activeBooking.endTime)}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Pickup Location</span>
                  <span className="text-sm font-semibold text-gray-900">{activeBooking.pickupLocation || '—'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Total Amount</span>
                  <span className="text-sm font-semibold text-gray-900">₹ {activeBooking.totalAmount || 0}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Payment</span>
                  <span className="text-sm font-semibold text-gray-900">{activeBooking.paymentMethod || '—'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-1">Deposit</span>
                  <span className="text-sm font-semibold text-gray-900">₹ {activeBooking.securityDeposit || 0} · {activeBooking.depositStatus || '—'}</span>
                </div>
              </div>
            </div>
          ) : null}

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
                  <tr className="bg-gray-800 text-sm text-white">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Scooty</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                        <td
                          onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                          className="px-5 py-4 text-blue-600 font-semibold text-sm cursor-pointer hover:underline"
                        >
                          {booking.bookingId || booking._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{vehicleLabel(booking.vehicle)}</td>
                        {/* startTime/endTime are "HH:mm" strings; the calendar day is on startDate/endDate. */}
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {formatDay(booking.startDate)} - {formatDay(booking.endDate)}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-900">₹ {booking.totalAmount || 0}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">{booking.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-sm text-gray-500">
                        No bookings found for this customer.
                      </td>
                    </tr>
                  )}
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
            <div className="p-5 text-center text-sm text-gray-500">
              No reviews submitted yet.
            </div>
          </div>

        </div>

      </div>

      {/* KYC document preview */}
      {preview && previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {preview.title}
                {preview.images.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">{preview.index + 1} / {preview.images.length}</span>
                )}
              </h3>
              <button onClick={() => setPreview(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 flex items-center justify-center p-4">
              <img src={previewImage} alt={preview.title} className="max-h-[70vh] w-auto object-contain rounded" />
            </div>
            {preview.images.length > 1 && (
              <div className="flex justify-between px-5 py-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={preview.index === 0}
                  onClick={() => setPreview((p) => ({ ...p, index: p.index - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={preview.index >= preview.images.length - 1}
                  onClick={() => setPreview((p) => ({ ...p, index: p.index + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
