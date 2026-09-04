import React, { useState, useEffect } from "react";
import { 
  ActivityIcon as Bike, CheckCheckIcon as CheckCircle, ClockIcon as Clock, WrenchIcon as Wrench, UsersIcon as Users, CalendarDaysIcon as Calendar, 
  TrendingUpIcon as TrendingUp, SquareActivityIcon as Activity, BanIcon as XCircle
} from "lucide-animated";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import StatCard from "../../../shared/components/admin/StatCard";
import { adminService } from "../services/adminService";

// Mock Data for Charts (Keep static for now since we don't have historical chart APIs)
const revenueData = [
  { name: "Mon", revenue: 4000 },
  { name: "Tue", revenue: 3000 },
  { name: "Wed", revenue: 5000 },
  { name: "Thu", revenue: 2780 },
  { name: "Fri", revenue: 6890 },
  { name: "Sat", revenue: 8390 },
  { name: "Sun", revenue: 7490 },
];

const bookingData = [
  { name: "Jan", bookings: 450 },
  { name: "Feb", bookings: 520 },
  { name: "Mar", bookings: 610 },
  { name: "Apr", bookings: 580 },
  { name: "May", bookings: 750 },
  { name: "Jun", bookings: 820 },
  { name: "Jul", bookings: 950 },
  { name: "Aug", bookings: 1120 },
  { name: "Sep", bookings: 980 },
  { name: "Oct", bookings: 1250 },
  { name: "Nov", bookings: 1400 },
  { name: "Dec", bookings: 1650 },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [invSummary, bookings, users] = await Promise.all([
          adminService.getInventorySummary(),
          adminService.getBookings({ limit: 5 }),
          adminService.getUsers({ limit: 5 })
        ]);
        
        setSummary(invSummary);
        
        // Map backend data to frontend table structure
        setRecentBookings(bookings.slice(0, 5).map(b => ({
          id: b._id.substring(0, 8).toUpperCase(),
          user: b.user?.fullName || "Unknown",
          scooty: b.vehicle?.name || "Unknown",
          status: b.status,
          amount: `₹${b.pricing?.total || 0}`
        })));

        setRecentUsers(users.slice(0, 5).map(u => ({
          id: u._id.substring(0, 8).toUpperCase(),
          name: u.fullName,
          joinDate: new Date(u.createdAt).toLocaleDateString(),
          status: u.isActive ? "Verified" : "Pending"
        })));
        
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !summary) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {/* Scooties Stats */}
        <StatCard title="Total Scooties" value={summary.totalVehicles} icon={<Bike />} trend="+12%" trendDirection="up" className="bg-indigo-50 border-indigo-100" />
        <StatCard title="Available" value={summary.available} icon={<CheckCircle />} helper="Ready to ride" className="bg-emerald-50 border-emerald-100" />
        <StatCard title="Currently Booked" value={summary.booked} icon={<Activity />} className="bg-blue-50 border-blue-100" />
        <StatCard title="Under Maintenance" value={summary.maintenance} icon={<Wrench />} trend="-2" trendDirection="down" className="bg-orange-50 border-orange-100" />
        
        {/* User & Bookings Stats */}
        <StatCard title="Total Users" value="--" icon={<Users />} trend="+156 this week" trendDirection="up" className="bg-purple-50 border-purple-100" />
        <StatCard title="Total Bookings" value="--" icon={<Calendar />} className="bg-cyan-50 border-cyan-100" />
        <StatCard title="Today's Bookings" value="--" icon={<Clock />} trend="+14%" trendDirection="up" className="bg-teal-50 border-teal-100" />
        <StatCard title="Pending Approvals" value="--" icon={<Clock />} helper="Requires action" className="bg-amber-50 border-amber-100" />
        <StatCard title="Cancelled Bookings" value="--" icon={<XCircle />} trend="-5%" trendDirection="down" className="bg-rose-50 border-rose-100" />
        <StatCard title="Today's Revenue" value="--" icon={<TrendingUp />} trend="+18%" trendDirection="up" className="bg-green-50 border-green-100" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
        <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Monthly Bookings</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Scooty</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentBookings.map((booking, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{booking.id}</td>
                    <td className="py-3 text-gray-600">{booking.user}</td>
                    <td className="py-3 text-gray-600">{booking.scooty}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'Active' ? 'bg-blue-50 text-blue-700' :
                        booking.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        booking.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Users</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-sm text-white">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentUsers.map((user, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{user.id}</td>
                    <td className="py-3 text-gray-600">{user.name}</td>
                    <td className="py-3 text-gray-600">{user.joinDate}</td>
                    <td className="py-3 text-right">
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
          </div>
        </div>
      </div>
    </div>
  );
}
