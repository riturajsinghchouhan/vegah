import React, { useState, useEffect } from "react";
import { Eye, Check, X, Search, Loader2 } from "lucide-react";
import { adminService } from "../services/adminService";

export default function AdminWallet() {
  const [activeTab, setActiveTab] = useState("Wallet");
  const [walletSummary, setWalletSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "Wallet") {
        const res = await adminService.getAdminWalletSummary();
        setWalletSummary(res.summary);
        setTransactions(res.transactions || []);
      } else {
        const res = await adminService.getRefunds();
        setRefunds(res || []);
      }
    } catch (err) {
      console.error("Error fetching wallet/refund data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleUpdateRefundStatus = async (id, status) => {
    try {
      await adminService.updateRefundStatus(id, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update refund status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Processing</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Completed</span>;
      case "REJECTED":
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
      </div>

      {/* Summary Cards */}
      {walletSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Registered Wallets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{walletSummary.totalWallets || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total System Wallet Balance</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{walletSummary.totalWalletBalance || 0}</p>
          </div>
        </div>
      )}

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
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>
            {/* Wallet Tab Content */}
            {activeTab === "Wallet" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-4 px-6 font-medium">Customer</th>
                      <th className="py-4 px-6 font-medium">Transaction Type</th>
                      <th className="py-4 px-6 font-medium">Amount</th>
                      <th className="py-4 px-6 font-medium">Description</th>
                      <th className="py-4 px-6 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">No transactions recorded</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {tx.wallet?.user?.name || "User"} ({tx.wallet?.user?.phone || tx.wallet?.user?.email || "N/A"})
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              tx.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-4 px-6 font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                          </td>
                          <td className="py-4 px-6 text-gray-600">{tx.description || tx.referenceType}</td>
                          <td className="py-4 px-6 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                      <th className="py-4 px-6 font-medium">Date</th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {refunds.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-gray-500">No refund requests found</td>
                      </tr>
                    ) : (
                      refunds.map((refund) => (
                        <tr key={refund._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900">{refund._id.slice(-6).toUpperCase()}</td>
                          <td className="py-4 px-6 text-blue-600 font-medium">
                            {refund.booking?.bookingId || refund.booking?._id || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-gray-700">{refund.booking?.user?.name || "Customer"}</td>
                          <td className="py-4 px-6 font-semibold text-gray-900">₹{refund.amount}</td>
                          <td className="py-4 px-6 text-gray-600">{refund.reason}</td>
                          <td className="py-4 px-6 text-gray-500 text-xs">{new Date(refund.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            {getStatusBadge(refund.status)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {refund.status === "PENDING" && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateRefundStatus(refund._id, "COMPLETED")}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Approve Refund to Wallet"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateRefundStatus(refund._id, "REJECTED")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Reject Refund"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
