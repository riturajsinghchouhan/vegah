import React, { useState } from "react";
import { Search, Filter, Eye, CheckCircle, Clock, CheckSquare, Download, Calendar } from "lucide-react";
import StatCard from "../../../shared/components/admin/StatCard";

const initialSettlements = [
  { id: "STL-901", owner: "Ather Energy Pvt Ltd", bookings: 145, gross: "₹1,45,000", commission: "₹14,500", deductions: "₹2,500", net: "₹1,28,000", date: "31 May 2025", status: "Paid" },
  { id: "STL-902", owner: "Ola Fleet Tech", bookings: 89, gross: "₹85,000", commission: "₹8,500", deductions: "₹0", net: "₹76,500", date: "31 May 2025", status: "Processing" },
  { id: "STL-903", owner: "TVS Motor Co", bookings: 112, gross: "₹98,500", commission: "₹9,850", deductions: "₹1,200", net: "₹87,450", date: "31 May 2025", status: "Pending" },
  { id: "STL-890", owner: "Hero Eco", bookings: 56, gross: "₹45,000", commission: "₹4,500", deductions: "₹500", net: "₹40,000", date: "15 May 2025", status: "Paid" },
  { id: "STL-889", owner: "Bounce Infinity", bookings: 23, gross: "₹18,000", commission: "₹1,800", deductions: "₹0", net: "₹16,200", date: "15 May 2025", status: "Pending" },
];

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState(initialSettlements);
  const [dateFilter, setDateFilter] = useState("This Month");

  const handleProcess = (id) => {
    setSettlements(settlements.map(s => 
      s.id === id ? { ...s, status: "Processing" } : s
    ));
  };

  const handleMarkPaid = (id) => {
    setSettlements(settlements.map(s => 
      s.id === id ? { ...s, status: "Paid" } : s
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Paid</span>;
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
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors cursor-pointer"
            >
              <option>Today</option>
              <option>7 Days</option>
              <option>This Month</option>
              <option>Custom Date</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-gray-500" />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Settled" value="₹12,45,800" icon={<CheckCircle />} trend="+15% this month" trendDirection="up" />
        <StatCard title="Net Payable" value="₹3,48,150" icon={<Clock />} helper="Pending across all partners" />
        <StatCard title="Processing" value="₹76,500" icon={<Clock />} helper="Initiated transfers" />
        <StatCard title="Pending Transfers" value="₹1,03,650" icon={<Clock />} helper="To be processed" />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search partner or ID..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
            Filter Status
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-800 text-sm text-white">
                <th className="py-4 px-6 font-medium">Settlement ID</th>
                <th className="py-4 px-6 font-medium">Owner / Partner</th>
                <th className="py-4 px-6 font-medium">Bookings</th>
                <th className="py-4 px-6 font-medium">Gross Rev.</th>
                <th className="py-4 px-6 font-medium">Commission (10%)</th>
                <th className="py-4 px-6 font-medium">Deductions</th>
                <th className="py-4 px-6 font-medium">Net Payable</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {settlements.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{item.id}</td>
                  <td className="py-4 px-6 font-semibold text-blue-600 cursor-pointer hover:underline">{item.owner}</td>
                  <td className="py-4 px-6 text-gray-600">{item.bookings}</td>
                  <td className="py-4 px-6 text-gray-900 font-medium">{item.gross}</td>
                  <td className="py-4 px-6 text-red-500 font-medium">-{item.commission}</td>
                  <td className="py-4 px-6 text-red-500">-{item.deductions}</td>
                  <td className="py-4 px-6 text-green-600 font-bold">{item.net}</td>
                  <td className="py-4 px-6 text-gray-500 text-xs">{item.date}</td>
                  <td className="py-4 px-6">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === "Pending" && (
                        <button 
                          onClick={() => handleProcess(item.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 font-medium rounded-lg text-xs hover:bg-blue-100 transition-colors"
                        >
                          Process
                        </button>
                      )}
                      {item.status === "Processing" && (
                        <button 
                          onClick={() => handleMarkPaid(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 font-medium rounded-lg text-xs hover:bg-green-100 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Mark Paid
                        </button>
                      )}
                      <button 
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
        </div>
      </div>
    </div>
  );
}
