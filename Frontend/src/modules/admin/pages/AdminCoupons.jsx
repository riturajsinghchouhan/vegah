import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, Power, PowerOff, X, Loader2 } from "lucide-react";
import { adminService } from "../services/adminService";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    minBookingAmount: "",
    maxDiscountAmount: "",
    usageLimitPerUser: "1",
    startDate: "",
    expiryDate: "",
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCoupons({ search });
      setCoupons(res || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [search]);

  const toggleStatus = async (id) => {
    try {
      await adminService.toggleCouponStatus(id);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await adminService.deleteCoupon(id);
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete coupon");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminService.createCoupon({
        ...formData,
        value: Number(formData.value),
        minBookingAmount: Number(formData.minBookingAmount || 0),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimitPerUser: Number(formData.usageLimitPerUser || 1),
      });
      setShowModal(false);
      setFormData({
        code: "",
        type: "PERCENTAGE",
        value: "",
        minBookingAmount: "",
        maxDiscountAmount: "",
        usageLimitPerUser: "1",
        startDate: "",
        expiryDate: "",
      });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Coupons Management</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Coupons</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search coupons..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
           </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Coupon
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] hide-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading coupons...
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px] relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="py-4 px-6 font-medium">Code</th>
                  <th className="py-4 px-6 font-medium">Type</th>
                  <th className="py-4 px-6 font-medium">Value</th>
                  <th className="py-4 px-6 font-medium">Min Booking</th>
                  <th className="py-4 px-6 font-medium">Max Discount</th>
                  <th className="py-4 px-6 font-medium">Used</th>
                  <th className="py-4 px-6 font-medium">Validity</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">No coupons found</td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-blue-600">{coupon.code}</td>
                      <td className="py-4 px-6 text-gray-700">{coupon.type}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `₹${coupon.value}`}
                      </td>
                      <td className="py-4 px-6 text-gray-600">₹{coupon.minBookingAmount || 0}</td>
                      <td className="py-4 px-6 text-gray-600">{coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : 'N/A'}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{coupon.usedCount || 0}</td>
                      <td className="py-4 px-6 text-gray-500 text-xs">
                        <div>{new Date(coupon.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-400">to {new Date(coupon.expiryDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          coupon.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {coupon.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleStatus(coupon._id)}
                            className={`p-1.5 rounded-lg transition-colors ${coupon.status === 'ACTIVE' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={coupon.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. SUMMER20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input 
                    type="number" 
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. 20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Amount (₹)</label>
                  <input 
                    type="number" 
                    value={formData.minBookingAmount}
                    onChange={(e) => setFormData({ ...formData, minBookingAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. 500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (₹)</label>
                  <input 
                    type="number" 
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. 200 (optional)" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit Per User</label>
                  <input 
                    type="number" 
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="1" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />} Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
