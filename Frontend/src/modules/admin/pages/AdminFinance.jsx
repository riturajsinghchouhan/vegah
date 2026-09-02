import React, { useState } from "react";
import { Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, IndianRupee, CreditCard, Wallet, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import StatCard from "../../../shared/components/admin/StatCard";

// Mock Data
const revenueData = [
  { date: "01 May", revenue: 25000 },
  { date: "05 May", revenue: 42000 },
  { date: "10 May", revenue: 38000 },
  { date: "15 May", revenue: 85000 },
  { date: "20 May", revenue: 65000 },
  { date: "25 May", revenue: 75000 },
  { date: "31 May", revenue: 95000 },
];

const paymentMethodsData = [
  { name: "UPI", value: 65, color: "#3b82f6" }, // blue-500
  { name: "Credit Card", value: 20, color: "#10b981" }, // green-500
  { name: "Debit Card", value: 10, color: "#f59e0b" }, // amber-500
  { name: "Wallet", value: 5, color: "#8b5cf6" }, // violet-500
];

const recentTransactions = [
  { id: "TXN10293", bookingId: "BK1025", customer: "Rahul Sharma", amount: "₹1,280", method: "UPI", status: "Success", date: "20 May 2025, 10:05 AM" },
  { id: "TXN10292", bookingId: "BK1024", customer: "Priya Verma", amount: "₹980", method: "Credit Card", status: "Success", date: "20 May 2025, 09:15 AM" },
  { id: "TXN10291", bookingId: "BK1023", customer: "Amit Patel", amount: "₹1,150", method: "Wallet", status: "Pending", date: "19 May 2025, 02:10 PM" },
  { id: "TXN10290", bookingId: "BK1022", customer: "Neha Singh", amount: "₹760", method: "UPI", status: "Refunded", date: "18 May 2025, 11:30 AM" },
  { id: "TXN10289", bookingId: "BK1021", customer: "Rohan Gupta", amount: "₹1,220", method: "Debit Card", status: "Failed", date: "17 May 2025, 04:05 PM" },
];

export default function AdminFinance() {
  const [dateFilter, setDateFilter] = useState("This Month");

  const getStatusBadge = (status) => {
    switch (status) {
      case "Success": return "bg-green-50 text-green-700 border-green-200";
      case "Pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Failed": return "bg-red-50 text-red-700 border-red-200";
      case "Refunded": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Finance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Finance</p>
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
            <Filter className="w-4 h-4 text-gray-500" />
            Filters
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Revenue" value="₹12,45,000" icon={<IndianRupee />} trend="+15% vs Last Year" trendDirection="up" />
        <StatCard title="Today's Revenue" value="₹24,500" icon={<IndianRupee />} trend="+5% vs Yesterday" trendDirection="up" />
        <StatCard title="Monthly Revenue" value="₹4,25,000" icon={<Calendar />} trend="+8% vs Last Month" trendDirection="up" />
        <StatCard title="Pending Payments" value="₹15,200" icon={<AlertCircle />} helper="Awaiting settlement" />
        <StatCard title="Refunds Processed" value="₹42,680" icon={<ArrowDownRight />} trend="-2% vs Last Month" trendDirection="down" />
        <StatCard title="Net Earnings" value="₹11,87,120" icon={<Wallet />} trend="+18% vs Last Year" trendDirection="up" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFinanceRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}K`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFinanceRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
          <div className="h-[220px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {paymentMethodsData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="text-gray-900 font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500">
                <th className="pb-3 font-medium px-2">Transaction ID</th>
                <th className="pb-3 font-medium px-2">Booking ID</th>
                <th className="pb-3 font-medium px-2">Customer</th>
                <th className="pb-3 font-medium px-2">Amount</th>
                <th className="pb-3 font-medium px-2">Method</th>
                <th className="pb-3 font-medium px-2">Status</th>
                <th className="pb-3 font-medium px-2">Date & Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentTransactions.map((txn, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2 font-medium text-gray-900">{txn.id}</td>
                  <td className="py-4 px-2 text-blue-600 hover:underline cursor-pointer">{txn.bookingId}</td>
                  <td className="py-4 px-2 text-gray-700">{txn.customer}</td>
                  <td className="py-4 px-2 font-semibold text-gray-900">{txn.amount}</td>
                  <td className="py-4 px-2 text-gray-600 flex items-center gap-1.5 mt-2.5">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {txn.method}
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-gray-500">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
