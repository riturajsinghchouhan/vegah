import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, CheckCircle, Clock, CheckSquare, Download, Calendar, Loader2 } from "lucide-react";
import StatCard from "../../../shared/components/admin/StatCard";
import { adminService } from "../services/adminService";

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [totalSettled, setTotalSettled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("This Month");

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        const res = await adminService.getSettlements();
        setSettlements(res || []);
        const total = (res || []).reduce((acc, s) => acc + (s.amount || 0), 0);
        setTotalSettled(total);
      } catch (err) {
        console.error("Error fetching settlements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettlements();
  }, [dateFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Settled":
      case "Paid":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Settled</span>;
      case "Processing":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Processing</span>;
      case "Pending":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Partner Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Settlements</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Settled" value={`₹${totalSettled.toLocaleString()}`} icon={<CheckCircle />} trend="+10% this month" trendDirection="up" />
        <StatCard title="Total Transactions" value={settlements.length.toString()} icon={<Clock />} helper="Processed payments" />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading settlements...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="py-4 px-6 font-medium">Payment / Txn ID</th>
                  <th className="py-4 px-6 font-medium">Gross Amount</th>
                  <th className="py-4 px-6 font-medium">Gateway Fee (2%)</th>
                  <th className="py-4 px-6 font-medium">Net Settlement</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">No settlements records found</td>
                  </tr>
                ) : (
                  settlements.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-blue-600">{item.paymentId}</td>
                      <td className="py-4 px-6 text-gray-900 font-medium">₹{item.amount}</td>
                      <td className="py-4 px-6 text-red-500 font-medium">-₹{item.gatewayFee}</td>
                      <td className="py-4 px-6 text-green-600 font-bold">₹{item.netSettlement}</td>
                      <td className="py-4 px-6 text-gray-500 text-xs">{new Date(item.date).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
