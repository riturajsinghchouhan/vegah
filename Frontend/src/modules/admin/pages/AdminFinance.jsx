import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, IndianRupee, CreditCard, Wallet, AlertCircle, Loader2 } from "lucide-react";
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

const formatChartDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value ?? "")
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatAmount = (n) =>
  Number.isFinite(Number(n))
    ? `₹${Number(n).toLocaleString("en-IN")}`
    : "—";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const METHOD_COLORS = {
  ONLINE: "#3b82f6",
  UPI: "#6366f1",
  CARD: "#8b5cf6",
  NET_BANKING: "#0ea5e9",
  WALLET: "#10b981",
  CASH: "#f59e0b",
  UNKNOWN: "#94a3b8",
};


export default function AdminFinance() {
  const [dateFilter, setDateFilter] = useState("This Month");
  const [financeData, setFinanceData] = useState(null);
  // The revenue trend used to plot a hardcoded May series no matter what the
  // business actually earned, which is not something to show on a finance screen.
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        setLoading(true);
        const [res, charts, stats] = await Promise.allSettled([
          adminService.getFinanceSummary(),
          adminService.getDashboardCharts(),
          adminService.getDashboardStats(),
        ]);
        if (res.status === "fulfilled") setFinanceData(res.value);
        else console.error("Error fetching finance:", res.reason);
        if (stats.status === "fulfilled") setDashboardStats(stats.value || {});

        if (charts.status === "fulfilled") {
          const series = charts.value?.revenueChart || [];
          setRevenueSeries(
            series.map((point) => ({
              date: formatChartDate(point.date),
              revenue: Number(point.revenue) || 0,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, [dateFilter]);

  const summary = financeData?.summary || {};
  const transactionsList = financeData?.recentTransactions?.length > 0
    ? financeData.recentTransactions
    : [];

  // The Payment Methods pie read a `paymentMethodsData` mock that no longer
  // exists, so the whole page died with "paymentMethodsData is not defined".
  // Derived from the real payment rows instead, as a share of amount.
  const paymentMethodsData = (() => {
    const totals = transactionsList.reduce((acc, t) => {
      const key = String(t.method || 'UNKNOWN').toUpperCase();
      acc[key] = (acc[key] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    if (!grandTotal) return [];
    return Object.entries(totals)
      .map(([name, amount]) => ({
        name: name.replace(/_/g, ' '),
        value: Math.round((amount / grandTotal) * 100),
        color: METHOD_COLORS[name] || METHOD_COLORS.UNKNOWN,
      }))
      .sort((a, b) => b.value - a.value);
  })();

  const pendingPayments = transactionsList
    .filter((t) => ["PENDING", "INITIATED"].includes(String(t.status || "").toUpperCase()))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Payment.status is upper-case on the API (SUCCESS/PENDING/...), so matching on
  // title case left every badge grey.
  const getStatusBadge = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "SUCCESS": return "bg-green-50 text-green-700 border-green-200";
      case "PENDING":
      case "INITIATED": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "FAILED": return "bg-red-50 text-red-700 border-red-200";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED": return "bg-purple-50 text-purple-700 border-purple-200";
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

      {/* KPI Stats Grid — every figure here used to be a hardcoded literal, so the
          finance screen reported invented revenue regardless of the real books. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Gross Revenue" value={formatAmount(summary.grossRevenue ?? 0)} icon={<IndianRupee />} helper="All settled payments" />
        <StatCard title="Today's Revenue" value={formatAmount(dashboardStats.todaysRevenue ?? 0)} icon={<IndianRupee />} helper="Since midnight" />
        <StatCard title="Net Revenue" value={formatAmount(summary.netRevenue ?? 0)} icon={<Wallet />} helper="Gross less refunds" />
        <StatCard title="Pending Payments" value={formatAmount(pendingPayments)} icon={<AlertCircle />} helper="Awaiting settlement" />
        <StatCard title="Refunds Processed" value={formatAmount(summary.totalRefunded ?? 0)} icon={<ArrowDownRight />} helper="Paid back to customers" />
        <StatCard title="Estimated Tax" value={formatAmount(Math.round(summary.estimatedTax ?? 0))} icon={<Calendar />} helper="GST on net revenue" />
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
            {revenueSeries.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                {loading ? "Loading revenue…" : "No revenue recorded for this period"}
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            )}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
          {paymentMethodsData.length === 0 ? (
            <div className="h-[220px] w-full flex-1 flex items-center justify-center text-sm text-gray-500">
              No payments recorded yet
            </div>
          ) : (
          <>
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
          </>
          )}
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
              <tr className="bg-gray-800 text-sm text-white">
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
              {transactionsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No transactions yet</td>
                </tr>
              )}
              {/* Rows come straight off the Payment documents: the old markup read
                  txn.id / txn.customer / txn.date, which exist on none of them. */}
              {transactionsList.map((txn, idx) => (
                <tr key={txn._id || idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2 font-medium text-gray-900">{String(txn._id || "").slice(-8) || "—"}</td>
                  <td className="py-4 px-2 text-blue-600 hover:underline cursor-pointer">{txn.booking?.bookingId || "—"}</td>
                  <td className="py-4 px-2 text-gray-700">{txn.booking?.user?.fullName || txn.booking?.user?.name || "—"}</td>
                  <td className="py-4 px-2 font-semibold text-gray-900">{formatAmount(txn.amount)}</td>
                  <td className="py-4 px-2 text-gray-600 flex items-center gap-1.5 mt-2.5">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {txn.method || "—"}
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(txn.status)}`}>
                      {txn.status || "—"}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-gray-500">{formatDateTime(txn.paidAt || txn.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
