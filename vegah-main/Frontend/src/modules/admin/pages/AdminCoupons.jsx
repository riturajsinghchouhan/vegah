import React, { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Power, PowerOff, X } from "lucide-react";

const initialCoupons = [
  { id: 1, code: "WELCOME50", type: "Percentage", value: "50%", minBooking: "₹500", maxDiscount: "₹200", usageLimit: "1 per user", usedCount: 145, startDate: "01 May 2025", expiryDate: "31 Dec 2025", status: "Active" },
  { id: 2, code: "FLAT100", type: "Flat", value: "₹100", minBooking: "₹800", maxDiscount: "₹100", usageLimit: "Unlimited", usedCount: 320, startDate: "15 May 2025", expiryDate: "15 Jun 2025", status: "Active" },
  { id: 3, code: "WEEKEND20", type: "Percentage", value: "20%", minBooking: "₹1,000", maxDiscount: "₹500", usageLimit: "2 per user", usedCount: 89, startDate: "01 Jun 2025", expiryDate: "30 Jun 2025", status: "Inactive" },
  { id: 4, code: "NEWUSER", type: "Flat", value: "₹250", minBooking: "₹1,000", maxDiscount: "₹250", usageLimit: "1 per user", usedCount: 56, startDate: "01 Jan 2025", expiryDate: "31 Dec 2025", status: "Active" },
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);

  const toggleStatus = (id) => {
    setCoupons(coupons.map(c => 
      c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c
    ));
  };

  const handleDelete = (id) => {
    if(window.confirm("Are you sure you want to delete this coupon?")) {
      setCoupons(coupons.filter(c => c.id !== id));
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
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
           </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            Filters
          </button>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Code</th>
                <th className="py-4 px-6 font-medium">Type</th>
                <th className="py-4 px-6 font-medium">Value</th>
                <th className="py-4 px-6 font-medium">Min Booking</th>
                <th className="py-4 px-6 font-medium">Max Discount</th>
                <th className="py-4 px-6 font-medium">Usage Limit</th>
                <th className="py-4 px-6 font-medium">Used</th>
                <th className="py-4 px-6 font-medium">Validity</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-blue-600">{coupon.code}</td>
                  <td className="py-4 px-6 text-gray-700">{coupon.type}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{coupon.value}</td>
                  <td className="py-4 px-6 text-gray-600">{coupon.minBooking}</td>
                  <td className="py-4 px-6 text-gray-600">{coupon.maxDiscount}</td>
                  <td className="py-4 px-6 text-gray-600">{coupon.usageLimit}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{coupon.usedCount}</td>
                  <td className="py-4 px-6 text-gray-500 text-xs">
                    <div>{coupon.startDate}</div>
                    <div className="text-gray-400">to {coupon.expiryDate}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      coupon.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(coupon.id)}
                        className={`p-1.5 rounded-lg transition-colors ${coupon.status === 'Active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={coupon.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. SUMMER20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Percentage</option>
                  <option>Flat Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Amount</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowModal(false); alert('Coupon created successfully'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Coupon</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
