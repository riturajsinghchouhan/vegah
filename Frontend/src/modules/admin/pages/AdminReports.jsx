import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  IndianRupee,
  RefreshCcw,
  Users,
  Download,
  Filter,
  ChevronDown
} from "lucide-react";
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
  Cell,
  Legend
} from "recharts";
import StatCard from "../../../shared/components/admin/StatCard";

// Mock Data
const revenueData = [
  { date: "01 May", revenue: 45000 },
  { date: "05 May", revenue: 52000 },
  { date: "10 May", revenue: 48000 },
  { date: "15 May", revenue: 125430 },
  { date: "20 May", revenue: 89000 },
  { date: "25 May", revenue: 95000 },
  { date: "31 May", revenue: 110000 },
];

const bookingsStatusData = [
  { name: "Completed", value: 1032, color: "#3b82f6" }, // blue-500
  { name: "Cancelled", value: 233, color: "#f97316" }, // orange-500
  { name: "Ongoing", value: 128, color: "#22c55e" }, // green-500
];

const revenueSourceData = [
  { name: "Scooty Rentals", value: 625430, color: "#3b82f6" }, // blue-500
  { name: "Late Fees", value: 65320, color: "#22c55e" }, // green-500
  { name: "Coupons Discount", value: -42650, color: "#a855f7" }, // purple-500
  { name: "Other Charges", value: 52020, color: "#f97316" }, // orange-500
];

const recentBookings = [
  { id: "BK1025", customer: "Rahul Sharma", scooty: "Ola S1 Pro", pickup: "20 May 10:00 AM", returnDate: "22 May 06:00 PM", amount: "₹1,280", status: "Completed", payment: "Paid" },
  { id: "BK1024", customer: "Priya Verma", scooty: "Ather 450X", pickup: "20 May 09:00 AM", returnDate: "22 May 05:00 PM", amount: "₹980", status: "Ongoing", payment: "Paid" },
  { id: "BK1023", customer: "Amit Patel", scooty: "TVS iQube", pickup: "19 May 02:00 PM", returnDate: "20 May 11:00 AM", amount: "₹1,150", status: "Completed", payment: "Paid" },
  { id: "BK1022", customer: "Neha Singh", scooty: "Ola S1 Air", pickup: "18 May 10:00 AM", returnDate: "19 May 10:00 AM", amount: "₹760", status: "Cancelled", payment: "Refunded" },
  { id: "BK1021", customer: "Rohan Gupta", scooty: "Ola S1 Pro", pickup: "17 May 04:00 PM", returnDate: "18 May 04:00 PM", amount: "₹1,220", status: "Completed", payment: "Paid" },
];

const topScooties = [
  { scooty: "Ola S1 Pro", bookings: 452, revenue: "₹2,85,430" },
  { scooty: "Ather 450X", bookings: 321, revenue: "₹2,01,320" },
  { scooty: "TVS iQube", bookings: 215, revenue: "₹1,25,450" },
  { scooty: "Ola S1 Air", bookings: 189, revenue: "₹1,05,220" },
  { scooty: "Ather 450S", bookings: 88, revenue: "₹68,000" },
];

const zoneBookings = [
  { zone: "Koramangala, BLR", bookings: 342, trend: "+12%" },
  { zone: "Indiranagar, BLR", bookings: 289, trend: "+5%" },
  { zone: "HSR Layout, BLR", bookings: 256, trend: "-2%" },
  { zone: "Whitefield, BLR", bookings: 198, trend: "+8%" },
];

export default function AdminReports() {
  const [dateFilter, setDateFilter] = useState("This Month");
  const [activeTab, setActiveTab] = useState("Overview");
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const tabs = ["Overview", "Bookings", "Revenue", "Customers", "Scooties", "Payments", "Refunds"];
  const dateOptions = ["Today", "7 Days", "This Month", "Custom Date"];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700';
      case 'Ongoing': return 'bg-blue-50 text-blue-700';
      case 'Cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPaymentColor = (payment) => {
    switch (payment) {
      case 'Paid': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Refunded': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Reports</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              {dateFilter}
              <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
            </button>
            
            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                {dateOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => { setDateFilter(option); setShowDateDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${dateFilter === option ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
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

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard title="Total Bookings" value="1,265" icon={<CalendarIcon />} trend="+12.5% vs Apr 2025" trendDirection="up" />
            <StatCard title="Completed Bookings" value="1,032" icon={<CheckCircle />} trend="+10.8% vs Apr 2025" trendDirection="up" />
            <StatCard title="Cancelled Bookings" value="233" icon={<XCircle />} trend="-4.3% vs Apr 2025" trendDirection="down" />
            <StatCard title="Total Revenue" value="₹7,85,420" icon={<IndianRupee />} trend="+15.6% vs Apr 2025" trendDirection="up" />
            <StatCard title="Total Refunds" value="₹42,680" icon={<RefreshCcw />} trend="-6.2% vs Apr 2025" trendDirection="down" />
            <StatCard title="Active Customers" value="2,843" icon={<Users />} trend="+9.7% vs Apr 2025" trendDirection="up" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Revenue Overview Area Chart */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">₹7,85,420</span>
                    <span className="text-sm font-medium text-green-600">↑ 15.6% vs Apr 2025</span>
                  </div>
                </div>
                <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="h-[250px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}K`} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bookings by Status Donut */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Bookings by Status</h3>
              <div className="h-[200px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingsStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingsStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {bookingsStatusData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-900 font-semibold">{item.value}</span>
                      <span className="text-gray-400">({((item.value / 1393) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Source Donut */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Source</h3>
              <div className="h-[200px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => `₹${Math.abs(value).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {revenueSourceData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-semibold">₹{Math.abs(item.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Bookings Table */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-3 font-medium px-2">Booking ID</th>
                      <th className="pb-3 font-medium px-2">Customer</th>
                      <th className="pb-3 font-medium px-2">Scooty</th>
                      <th className="pb-3 font-medium px-2">Pickup Date</th>
                      <th className="pb-3 font-medium px-2">Return Date</th>
                      <th className="pb-3 font-medium px-2">Amount</th>
                      <th className="pb-3 font-medium px-2">Status</th>
                      <th className="pb-3 font-medium px-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentBookings.map((booking, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2 font-medium text-gray-900">{booking.id}</td>
                        <td className="py-4 px-2 text-gray-700">{booking.customer}</td>
                        <td className="py-4 px-2 text-gray-600">{booking.scooty}</td>
                        <td className="py-4 px-2 text-gray-500 text-xs">{booking.pickup}</td>
                        <td className="py-4 px-2 text-gray-500 text-xs">{booking.returnDate}</td>
                        <td className="py-4 px-2 font-medium text-gray-900">{booking.amount}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wider ${getPaymentColor(booking.payment)}`}>
                            {booking.payment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Scooties & Zone-wise Box */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Top Scooties */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Scooties by Bookings</h3>
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
                </div>
                <div className="space-y-4">
                  {topScooties.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                          {/* Placeholder for scooty image/icon */}
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.scooty}</p>
                          <p className="text-xs text-gray-500">{item.bookings} Bookings</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Analytics Row (Zone-wise included here) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Average Order Value</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">₹620</p>
                </div>
                <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">↑ 6.7%</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Average Rental Duration</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">1.8 Days</p>
                </div>
                <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">↑ 4.1%</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Customer Satisfaction</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">4.6 / 5</p>
                </div>
                <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">↑ 0.3</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Top Zone</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-900 truncate pr-2">{zoneBookings[0].zone}</p>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{zoneBookings[0].bookings} bks</span>
                 </div>
              </div>
          </div>
          
        </div>
      )}

      {activeTab === "Bookings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Bookings" value="1,265" icon={<CalendarIcon />} trend="+12.5%" />
            <StatCard title="Completed" value="1,032" icon={<CheckCircle />} trend="+10.8%" />
            <StatCard title="Ongoing" value="128" icon={<RefreshCcw />} trend="stable" />
            <StatCard title="Cancelled" value="105" icon={<XCircle />} trend="-4.3%" trendDirection="down" />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings Ledger</h3>
             {/* Reusing Recent Bookings Table for demonstration */}
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-3 font-medium px-2">Booking ID</th>
                      <th className="pb-3 font-medium px-2">Customer</th>
                      <th className="pb-3 font-medium px-2">Scooty</th>
                      <th className="pb-3 font-medium px-2">Pickup Date</th>
                      <th className="pb-3 font-medium px-2">Status</th>
                      <th className="pb-3 font-medium px-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentBookings.map((booking, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2 font-medium text-gray-900">{booking.id}</td>
                        <td className="py-4 px-2 text-gray-700">{booking.customer}</td>
                        <td className="py-4 px-2 text-gray-600">{booking.scooty}</td>
                        <td className="py-4 px-2 text-gray-500 text-xs">{booking.pickup}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wider ${getPaymentColor(booking.payment)}`}>{booking.payment}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === "Revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value="₹7,85,420" icon={<IndianRupee />} trend="+15.6%" />
            <StatCard title="Average Order Value" value="₹620" icon={<IndianRupee />} trend="+6.7%" />
            <StatCard title="Coupon Discounts" value="₹42,650" icon={<RefreshCcw />} trend="+12%" trendDirection="down" />
            <StatCard title="Late Fees Collected" value="₹65,320" icon={<IndianRupee />} trend="+4%" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenueTab" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}K`} dx={-10} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueTab)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h3>
                <div className="h-[200px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {revenueSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `₹${Math.abs(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "Customers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Customers" value="12,450" icon={<Users />} trend="+5.2%" />
            <StatCard title="Active This Month" value="2,843" icon={<CheckCircle />} trend="+9.7%" />
            <StatCard title="New Signups" value="450" icon={<Users />} trend="-2.1%" trendDirection="down" />
            <StatCard title="Banned Accounts" value="42" icon={<XCircle />} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Customer Growth Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Growth Trend</h3>
              <div className="h-[300px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: "Jan", users: 8500 }, { month: "Feb", users: 9200 }, 
                    { month: "Mar", users: 10100 }, { month: "Apr", users: 11400 }, 
                    { month: "May", users: 12450 }
                  ]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers Leaderboard */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-between">
                Top Spenders
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">All Time</span>
              </h3>
              <div className="space-y-5 flex-1">
                {[
                  { name: "Rahul Sharma", bookings: 24, spent: "₹18,400", rank: 1, color: "text-amber-500 bg-amber-50 border-amber-200" },
                  { name: "Priya Verma", bookings: 18, spent: "₹12,100", rank: 2, color: "text-slate-500 bg-slate-50 border-slate-200" },
                  { name: "Amit Patel", bookings: 15, spent: "₹10,500", rank: 3, color: "text-amber-700 bg-orange-50 border-orange-200" },
                  { name: "Neha Singh", bookings: 12, spent: "₹8,200", rank: 4, color: "text-gray-500 bg-gray-50 border-gray-100" },
                  { name: "Vikas Kumar", bookings: 9, spent: "₹6,100", rank: 5, color: "text-gray-500 bg-gray-50 border-gray-100" }
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${c.color}`}>
                        #{c.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.bookings} Bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 text-sm">{c.spent}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                View All Customers
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Scooties" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Fleet" value="450" icon={<RefreshCcw />} />
            <StatCard title="Active Rentals" value="128" icon={<CheckCircle />} />
            <StatCard title="Under Maintenance" value="15" icon={<XCircle />} />
            <StatCard title="Avg. Utilization" value="68%" icon={<CalendarIcon />} trend="+2%" />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {topScooties.map((s, i) => (
                 <div key={i} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50/50">
                    <div>
                      <p className="font-semibold text-gray-900">{s.scooty}</p>
                      <p className="text-xs text-gray-500">{s.bookings} Total Bookings</p>
                    </div>
                    <span className="font-bold text-green-600">{s.revenue}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Payments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Collected" value="₹7,85,420" icon={<IndianRupee />} trend="+15.6%" />
            <StatCard title="Successful Payments" value="1,240" icon={<CheckCircle />} />
            <StatCard title="Failed Payments" value="45" icon={<XCircle />} />
            <StatCard title="Pending Settlements" value="₹12,400" icon={<RefreshCcw />} />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-3 font-medium px-2">Transaction ID</th>
                      <th className="pb-3 font-medium px-2">Booking ID</th>
                      <th className="pb-3 font-medium px-2">Date</th>
                      <th className="pb-3 font-medium px-2">Method</th>
                      <th className="pb-3 font-medium px-2">Amount</th>
                      <th className="pb-3 font-medium px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { tid: "TXN90812", bid: "BK1025", date: "20 May, 10:05 AM", method: "UPI", amt: "₹1,280", status: "Success" },
                      { tid: "TXN90811", bid: "BK1024", date: "20 May, 09:12 AM", method: "Credit Card", amt: "₹980", status: "Success" },
                      { tid: "TXN90810", bid: "-", date: "19 May, 06:30 PM", method: "Wallet Topup", amt: "₹500", status: "Failed" },
                    ].map((tx, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 px-2 font-medium text-gray-900">{tx.tid}</td>
                        <td className="py-4 px-2 text-blue-600">{tx.bid}</td>
                        <td className="py-4 px-2 text-gray-500 text-xs">{tx.date}</td>
                        <td className="py-4 px-2 text-gray-700">{tx.method}</td>
                        <td className="py-4 px-2 font-medium">{tx.amt}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase ${tx.status === 'Success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === "Refunds" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Refunded" value="₹42,680" icon={<RefreshCcw />} />
            <StatCard title="Pending Refunds" value="12" icon={<CalendarIcon />} />
            <StatCard title="Avg Processing Time" value="1.2 Days" icon={<CheckCircle />} />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Requests</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-3 font-medium px-2">Booking ID</th>
                      <th className="pb-3 font-medium px-2">Customer</th>
                      <th className="pb-3 font-medium px-2">Reason</th>
                      <th className="pb-3 font-medium px-2">Amount</th>
                      <th className="pb-3 font-medium px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { bid: "BK1022", customer: "Neha Singh", reason: "Vehicle Breakdown", amt: "₹760", status: "Processed" },
                      { bid: "BK0991", customer: "Amit Patel", reason: "Cancelled before pickup", amt: "₹500", status: "Pending" },
                    ].map((tx, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 px-2 text-blue-600 font-medium">{tx.bid}</td>
                        <td className="py-4 px-2 text-gray-700">{tx.customer}</td>
                        <td className="py-4 px-2 text-gray-500">{tx.reason}</td>
                        <td className="py-4 px-2 font-medium text-gray-900">{tx.amt}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase ${tx.status === 'Processed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
