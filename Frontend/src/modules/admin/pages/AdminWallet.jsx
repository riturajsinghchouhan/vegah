import React, { useState, useEffect } from "react";
import { Plus, Minus, Search, Loader2, Check, X, Wallet, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { adminService } from "../services/adminService";
import Modal from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";

export default function AdminWallet() {
  const [activeTab, setActiveTab] = useState("Customers");
  const [walletSummary, setWalletSummary] = useState(null);
  const [customerWallets, setCustomerWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for Add/Deduct Funds
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [adjustType, setAdjustType] = useState("CREDIT"); // "CREDIT" or "DEBIT"
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await adminService.getAdminWalletSummary();
      setWalletSummary(summaryRes.summary);
      setTransactions(summaryRes.transactions || []);

      if (activeTab === "Customers") {
        const custRes = await adminService.getCustomerWallets({ search: searchTerm });
        setCustomerWallets(custRes || []);
      } else if (activeTab === "Refunds") {
        const refundRes = await adminService.getRefunds();
        setRefunds(refundRes || []);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAdjustModal = (customer, type) => {
    setSelectedCustomer(customer);
    setAdjustType(type);
    setAdjustAmount("");
    setAdjustDescription("");
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || Number(adjustAmount) <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setAdjusting(true);
      await adminService.adjustCustomerWallet({
        userId: selectedCustomer.userId,
        amount: Number(adjustAmount),
        type: adjustType,
        description: adjustDescription || (adjustType === "CREDIT" ? "Added by Admin" : "Deducted by Admin")
      });

      alert(`₹${adjustAmount} ${adjustType === 'CREDIT' ? 'added to' : 'deducted from'} ${selectedCustomer.name}'s wallet successfully!`);
      setSelectedCustomer(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to adjust wallet balance");
    } finally {
      setAdjusting(false);
    }
  };

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

  const filteredCustomers = customerWallets.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Wallet Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer wallets, credit/debit funds, view transactions and refunds</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customer Wallets</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{customerWallets.length || walletSummary?.totalWallets || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total System Wallet Balance</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">₹{(walletSummary?.totalWalletBalance || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Wallet Transactions</p>
            <p className="text-2xl font-bold text-purple-600 mt-0.5">{transactions.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        {[
          { id: "Customers", label: "Customer Wallets" },
          { id: "Transactions", label: "Transactions Log" },
          { id: "Refunds", label: "Refund Requests" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Box */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Search Bar for Customers and Transactions */}
        {(activeTab === "Customers" || activeTab === "Transactions") && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <form onSubmit={handleSearchSubmit} className="flex items-center max-w-md bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <Search className="text-gray-400 mr-3" size={18} />
              <input 
                type="text" 
                placeholder="Search customer by name, email, or phone..." 
                className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading wallet data...
          </div>
        ) : (
          <>
            {/* Customer Wallets Tab */}
            {activeTab === "Customers" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-4 px-6 font-medium">Customer Name</th>
                      <th className="py-4 px-6 font-medium">Contact Details</th>
                      <th className="py-4 px-6 font-medium">Current Wallet Balance</th>
                      <th className="py-4 px-6 font-medium">Account Status</th>
                      <th className="py-4 px-6 font-medium text-right">Actions (Add / Deduct)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">No customers found</td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.userId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-900">
                            {cust.name}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            <div>{cust.phone}</div>
                            <div className="text-xs text-gray-400">{cust.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-base font-extrabold text-emerald-600">
                              ₹{(cust.balance || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              cust.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {cust.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenAdjustModal(cust, "CREDIT")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={14} /> Add Money
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAdjustModal(cust, "DEBIT")}
                                className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                              >
                                <Minus size={14} /> Deduct Money
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "Transactions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-4 px-6 font-medium">Customer</th>
                      <th className="py-4 px-6 font-medium">Type</th>
                      <th className="py-4 px-6 font-medium">Amount</th>
                      <th className="py-4 px-6 font-medium">Description</th>
                      <th className="py-4 px-6 font-medium">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">No wallet transactions recorded yet</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {tx.wallet?.user?.fullName || tx.wallet?.user?.name || "Customer"} 
                            <span className="text-xs text-gray-400 block">{tx.wallet?.user?.phone || tx.wallet?.user?.email}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-max ${
                              tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.type === 'CREDIT' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-4 px-6 font-bold text-base ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                          </td>
                          <td className="py-4 px-6 text-gray-600 font-medium">{tx.description || tx.referenceType}</td>
                          <td className="py-4 px-6 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Refunds Tab */}
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
                          <td className="py-4 px-6 text-gray-700">{refund.booking?.user?.fullName || refund.booking?.user?.name || "Customer"}</td>
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
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                    title="Approve Refund to Wallet"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateRefundStatus(refund._id, "REJECTED")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal for Adding / Deducting Funds */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={adjustType === 'CREDIT' ? "➕ Add Money to Customer Wallet" : "➖ Deduct Money from Customer Wallet"}
        size="md"
      >
        {selectedCustomer && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Target Customer</p>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">{selectedCustomer.name}</h3>
              <p className="text-xs text-gray-500">{selectedCustomer.phone} • {selectedCustomer.email}</p>
              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Current Wallet Balance:</span>
                <span className="font-extrabold text-emerald-600 text-base">₹{(selectedCustomer.balance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Action Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType("CREDIT")}
                  className={`py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    adjustType === "CREDIT" ? "bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Plus size={16} /> Add (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("DEBIT")}
                  className={`py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    adjustType === "DEBIT" ? "bg-red-50 text-red-700 border-red-500 ring-2 ring-red-500/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Minus size={16} /> Deduct (Debit)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number"
                min="1"
                required
                placeholder="e.g. 500"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>

            {/* Description / Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">
                Reason / Description
              </label>
              <input 
                type="text"
                placeholder={adjustType === 'CREDIT' ? "e.g. Promotional bonus / Cash deposit" : "e.g. Penalty / Manual adjustment"}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
              />
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setSelectedCustomer(null)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={adjusting}
                className={`${adjustType === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white border-none disabled:opacity-50`}
              >
                {adjusting ? "Processing..." : (adjustType === 'CREDIT' ? "Confirm Add Money" : "Confirm Deduct Money")}
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
