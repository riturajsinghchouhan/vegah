import React, { useState } from "react";
import { Eye, Check, X, Search, Filter } from "lucide-react";

// Mock Data for Wallet
const initialWalletData = [
  { id: 1, customer: "Rahul Sharma", currentBalance: "₹1,200", totalAdded: "₹5,000", totalUsed: "₹3,800", lastTransaction: "15 May 2025" },
  { id: 2, customer: "Priya Verma", currentBalance: "₹450", totalAdded: "₹2,500", totalUsed: "₹2,050", lastTransaction: "10 May 2025" },
  { id: 3, customer: "Amit Patel", currentBalance: "₹0", totalAdded: "₹1,000", totalUsed: "₹1,000", lastTransaction: "05 May 2025" },
  { id: 4, customer: "Neha Singh", currentBalance: "₹3,500", totalAdded: "₹8,000", totalUsed: "₹4,500", lastTransaction: "20 May 2025" },
  { id: 5, customer: "Rohan Gupta", currentBalance: "₹150", totalAdded: "₹500", totalUsed: "₹350", lastTransaction: "18 May 2025" },
];

// Mock Data for Refunds
const initialRefundsData = [
  { id: "RF1001", bookingId: "BK1025", customer: "Rahul Sharma", amount: "₹500", reason: "Vehicle Not Available", method: "UPI", date: "20 May 2025", status: "Pending" },
  { id: "RF1002", bookingId: "BK1022", customer: "Neha Singh", amount: "₹760", reason: "Customer Cancelled", method: "Credit Card", date: "18 May 2025", status: "Completed" },
  { id: "RF1003", bookingId: "BK1018", customer: "Vikram Kumar", amount: "₹1,200", reason: "Overcharged", method: "Wallet", date: "15 May 2025", status: "Processing" },
  { id: "RF1004", bookingId: "BK1015", customer: "Pooja Das", amount: "₹300", reason: "Poor Condition", method: "UPI", date: "12 May 2025", status: "Rejected" },
  { id: "RF1005", bookingId: "BK1010", customer: "Amit Patel", amount: "₹1,150", reason: "Late Delivery", method: "Debit Card", date: "10 May 2025", status: "Pending" },
];

export default function AdminWallet() {
  const [activeTab, setActiveTab] = useState("Wallet");
  const [refunds, setRefunds] = useState(initialRefundsData);
  
  // Handlers for refund actions
  const handleApprove = (id) => {
    setRefunds(refunds.map(refund => 
      refund.id === id ? { ...refund, status: "Processing" } : refund
    ));
    // In a real app, this might directly go to 'Completed' or 'Processing' depending on payment gateway
  };

  const handleReject = (id) => {
    setRefunds(refunds.map(refund => 
      refund.id === id ? { ...refund, status: "Rejected" } : refund
    ));
  };

  const handleViewDetails = (id) => {
    alert(`Viewing details for Refund ID: ${id}`);
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
      case "Processing":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Processing</span>;
      case "Completed":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Completed</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Wallet & Refunds</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Wallet</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
           </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        {["Wallet", "Refunds"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Wallet Tab Content */}
        {activeTab === "Wallet" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="py-4 px-6 font-medium">Customer</th>
                  <th className="py-4 px-6 font-medium">Current Balance</th>
                  <th className="py-4 px-6 font-medium">Total Added</th>
                  <th className="py-4 px-6 font-medium">Total Used</th>
                  <th className="py-4 px-6 font-medium">Last Transaction</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {initialWalletData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{row.customer}</td>
                    <td className="py-4 px-6 text-gray-900 font-semibold">{row.currentBalance}</td>
                    <td className="py-4 px-6 text-green-600">{row.totalAdded}</td>
                    <td className="py-4 px-6 text-gray-600">{row.totalUsed}</td>
                    <td className="py-4 px-6 text-gray-500">{row.lastTransaction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
               <span className="text-sm text-gray-500">Showing 1 to 5 of 5 entries</span>
               <div className="flex gap-1">
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 bg-white cursor-not-allowed">Prev</button>
                  <button className="px-3 py-1 border border-blue-500 rounded text-sm text-white bg-blue-500">1</button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 bg-white cursor-not-allowed">Next</button>
               </div>
            </div>
          </div>
        )}

        {/* Refunds Tab Content */}
        {activeTab === "Refunds" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="py-4 px-6 font-medium">Refund ID</th>
                  <th className="py-4 px-6 font-medium">Booking ID</th>
                  <th className="py-4 px-6 font-medium">Customer</th>
                  <th className="py-4 px-6 font-medium">Amount</th>
                  <th className="py-4 px-6 font-medium">Reason</th>
                  <th className="py-4 px-6 font-medium">Method</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{refund.id}</td>
                    <td className="py-4 px-6 text-blue-600 hover:underline cursor-pointer">{refund.bookingId}</td>
                    <td className="py-4 px-6 text-gray-700">{refund.customer}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{refund.amount}</td>
                    <td className="py-4 px-6 text-gray-600">{refund.reason}</td>
                    <td className="py-4 px-6 text-gray-500">{refund.method}</td>
                    <td className="py-4 px-6 text-gray-500 text-xs">{refund.date}</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {refund.status === "Pending" && (
                          <>
                            <button 
                              onClick={() => handleApprove(refund.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Refund"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(refund.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Refund"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleViewDetails(refund.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
               <span className="text-sm text-gray-500">Showing 1 to 5 of 5 entries</span>
               <div className="flex gap-1">
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 bg-white cursor-not-allowed">Prev</button>
                  <button className="px-3 py-1 border border-blue-500 rounded text-sm text-white bg-blue-500">1</button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 bg-white cursor-not-allowed">Next</button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
