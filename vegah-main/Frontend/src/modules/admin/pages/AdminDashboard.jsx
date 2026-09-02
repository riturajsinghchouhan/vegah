import React from "react";
import { 
  Bike, CheckCircle, Clock, Wrench, Users, Calendar, 
  TrendingUp, Activity, XCircle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";
import StatCard from "../../../shared/components/admin/StatCard";

// Mock Data for Charts
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

// Mock Data for Tables
const recentBookings = [
  { id: "B-1001", user: "Alice Smith", scooty: "Ola S1 Pro", status: "Active", amount: "₹450" },
  { id: "B-1002", user: "Bob Johnson", scooty: "Ather 450X", status: "Completed", amount: "₹320" },
  { id: "B-1003", user: "Charlie Davis", scooty: "TVS iQube", status: "Cancelled", amount: "₹0" },
  { id: "B-1004", user: "Diana Evans", scooty: "Hero Vida", status: "Pending", amount: "₹500" },
];

const recentUsers = [
  { id: "U-501", name: "Alice Smith", joinDate: "2023-10-01", status: "Verified" },
  { id: "U-502", name: "Bob Johnson", joinDate: "2023-10-02", status: "Verified" },
  { id: "U-503", name: "Charlie Davis", joinDate: "2023-10-03", status: "Pending" },
  { id: "U-504", name: "Diana Evans", joinDate: "2023-10-03", status: "Verified" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {/* Scooties Stats */}
        <StatCard title="Total Scooties" value="156" icon={<Bike />} trend="+12%" trendDirection="up" />
        <StatCard title="Available" value="89" icon={<CheckCircle />} helper="Ready to ride" />
        <StatCard title="Currently Booked" value="54" icon={<Activity />} />
        <StatCard title="Under Maintenance" value="13" icon={<Wrench />} trend="-2" trendDirection="down" />
        
        {/* User & Bookings Stats */}
        <StatCard title="Total Users" value="4,821" icon={<Users />} trend="+156 this week" trendDirection="up" />
        <StatCard title="Total Bookings" value="12,450" icon={<Calendar />} />
        <StatCard title="Today's Bookings" value="142" icon={<Clock />} trend="+14%" trendDirection="up" />
        <StatCard title="Pending Approvals" value="8" icon={<Clock />} helper="Requires action" />
        <StatCard title="Cancelled Bookings" value="24" icon={<XCircle />} trend="-5%" trendDirection="down" />
        <StatCard title="Today's Revenue" value="₹42,500" icon={<TrendingUp />} trend="+18%" trendDirection="up" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Bookings</h3>
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
                <tr className="border-b border-gray-100 text-sm text-gray-500">
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
                <tr className="border-b border-gray-100 text-sm text-gray-500">
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
