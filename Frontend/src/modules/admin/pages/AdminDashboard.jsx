import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ActivityIcon as Bike, CheckCheckIcon as CheckCircle, ClockIcon as Clock, WrenchIcon as Wrench, UsersIcon as Users, CalendarDaysIcon as Calendar, 
  TrendingUpIcon as TrendingUp, SquareActivityIcon as Activity, BanIcon as XCircle, RefreshCwIcon as RefreshCw
} from "lucide-animated";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import StatCard from "../../../shared/components/admin/StatCard";
import { adminService } from "../services/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invSummary, dashStats, dashCharts, bookingsRes, usersRes] = await Promise.allSettled([
        adminService.getInventorySummary(),
        adminService.getDashboardStats(),
        adminService.getDashboardCharts({ period: chartPeriod }),
        adminService.getBookings({ limit: 5 }),
        adminService.getUsers({ limit: 5 })
      ]);
      
      if (invSummary.status === "fulfilled") setSummary(invSummary.value);
      if (dashStats.status === "fulfilled") setStats(dashStats.value);
      if (dashCharts.status === "fulfilled") setCharts(dashCharts.value);
      
      if (bookingsRes.status === "fulfilled" && Array.isArray(bookingsRes.value)) {
        setRecentBookings(bookingsRes.value.slice(0, 5).map(b => ({
          id: b._id ? b._id.substring(0, 8).toUpperCase() : (b.id || "BK-001"),
          user: b.user?.fullName || b.user?.name || "Customer",
          scooty: b.vehicle?.name || b.vehicleName || "EV Scooty",
          status: b.status || "CONFIRMED",
          amount: `₹${b.pricing?.total || b.totalAmount || b.total || 0}`
        })));
      }

      if (usersRes.status === "fulfilled") {
        const userList = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.users || []);
        setRecentUsers(userList.slice(0, 5).map(u => ({
          id: u._id ? u._id.substring(0, 8).toUpperCase() : (u.id || "USR-01"),
          name: u.fullName || u.name || "User",
          joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recently",
          status: u.isActive !== false ? "Verified" : "Pending"
        })));
      }
      
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("Unable to connect to dashboard API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [chartPeriod]);

  if (loading && !summary && !stats) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-3" />
        <p className="text-sm font-medium text-gray-500">Connecting & loading live dashboard API data...</p>
      </div>
    );
  }

  // Chart data formatting
  const revenueChartData = charts?.revenueChart?.length > 0
    ? charts.revenueChart.map(item => ({
        name: item.date || item.name,
        revenue: item.revenue || 0
      }))
    : [
        { name: "Mon", revenue: 4000 },
        { name: "Tue", revenue: 3000 },
        { name: "Wed", revenue: 5000 },
        { name: "Thu", revenue: 2780 },
        { name: "Fri", revenue: 6890 },
        { name: "Sat", revenue: 8390 },
        { name: "Sun", revenue: 7490 }
      ];

  const bookingChartData = charts?.bookingChart?.length > 0
    ? charts.bookingChart.map(item => ({
        name: item.date || item.name,
        bookings: item.bookings || 0
      }))
    : [
        { name: "Mon", bookings: 12 },
        { name: "Tue", bookings: 19 },
        { name: "Wed", bookings: 15 },
        { name: "Thu", bookings: 22 },
        { name: "Fri", bookings: 30 },
        { name: "Sat", bookings: 45 },
        { name: "Sun", bookings: 38 }
      ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live platform performance & inventory statistics</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {/* Scooties Stats */}
        <StatCard title="Total Scooties" value={summary?.totalVehicles ?? 0} icon={<Bike />} trend="+12%" trendDirection="up" className="bg-indigo-50 border-indigo-100" />
        <StatCard title="Available" value={summary?.available ?? 0} icon={<CheckCircle />} helper="Ready to ride" className="bg-emerald-50 border-emerald-100" />
        <StatCard title="Currently Booked" value={summary?.booked ?? 0} icon={<Activity />} className="bg-blue-50 border-blue-100" />
        <StatCard title="Under Maintenance" value={summary?.maintenance ?? 0} icon={<Wrench />} className="bg-orange-50 border-orange-100" />
        
        {/* User & Bookings Stats */}
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<Users />} trend="Active riders" trendDirection="up" className="bg-purple-50 border-purple-100" />
        <StatCard title="Total Bookings" value={stats?.totalBookings ?? 0} icon={<Calendar />} className="bg-cyan-50 border-cyan-100" />
        <StatCard title="Today's Bookings" value={stats?.todaysBookings ?? 0} icon={<Clock />} className="bg-teal-50 border-teal-100" />
        <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={<Clock />} helper="Requires action" className="bg-amber-50 border-amber-100" />
        <StatCard title="Cancelled Today" value={stats?.cancelledToday ?? 0} icon={<XCircle />} className="bg-rose-50 border-rose-100" />
        <StatCard title="Today's Revenue" value={`₹${(stats?.todaysRevenue ?? 0).toLocaleString("en-IN")}`} icon={<TrendingUp />} trend="Live revenue" trendDirection="up" className="bg-green-50 border-green-100" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Revenue Trend</h3>
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-blue-100 text-xs font-medium">
              {["week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    chartPeriod === p ? "bg-blue-600 text-white font-bold" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 shadow-xs">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Bookings Volume</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bookings Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            {recentBookings.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No recent bookings recorded.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-sm text-white">
                    <th className="pb-3 px-3 font-medium">ID</th>
                    <th className="pb-3 px-3 font-medium">User</th>
                    <th className="pb-3 px-3 font-medium">Scooty</th>
                    <th className="pb-3 px-3 font-medium">Status</th>
                    <th className="pb-3 px-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentBookings.map((booking, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900">{booking.id}</td>
                      <td className="py-3 px-3 text-gray-600">{booking.user}</td>
                      <td className="py-3 px-3 text-gray-600">{booking.scooty}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'ACTIVE' || booking.status === 'Active' ? 'bg-blue-50 text-blue-700' :
                          booking.status === 'COMPLETED' || booking.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          booking.status?.includes('CANCELLED') ? 'bg-red-50 text-red-700' :
                          'bg-orange-50 text-orange-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-900">{booking.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Users</h3>
            <button
              onClick={() => navigate("/admin/customers")}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No recent registered users.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-sm text-white">
                    <th className="pb-3 px-3 font-medium">ID</th>
                    <th className="pb-3 px-3 font-medium">Name</th>
                    <th className="pb-3 px-3 font-medium">Joined</th>
                    <th className="pb-3 px-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentUsers.map((user, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900">{user.id}</td>
                      <td className="py-3 px-3 text-gray-600">{user.name}</td>
                      <td className="py-3 px-3 text-gray-600">{user.joinDate}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'Verified' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
