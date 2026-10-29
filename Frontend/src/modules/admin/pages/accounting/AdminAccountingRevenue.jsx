import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import { IndianRupee, Wallet, Banknote, CreditCard, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../../../../shared/components/admin/StatCard";

const PERIODS = ["Today", "This Week", "This Month", "This Year", "Custom"];

const formatAmount = (n) => (Number.isFinite(Number(n)) ? `₹${Number(n).toLocaleString("en-IN")}` : "—");

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatTrendLabel = (period, groupBy) => {
  const [y, m, d] = String(period).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return groupBy === "month"
    ? date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Same period logic as Accounting > Overview, so the numbers line up exactly.
const getRange = (period, custom) => {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "Today":
      return { from: startOfToday, to: endOfToday, groupBy: "day" };
    case "This Week": {
      const daysSinceMonday = (now.getDay() + 6) % 7;
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - daysSinceMonday);
      return { from, to: endOfToday, groupBy: "day" };
    }
    case "This Year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday, groupBy: "month" };
    case "Custom": {
      if (!custom.from || !custom.to) return null;
      const from = new Date(`${custom.from}T00:00:00`);
      const to = new Date(`${custom.to}T23:59:59.999`);
      if (from > to) return null;
      const spanDays = (to - from) / 86400000;
      return { from, to, groupBy: spanDays > 62 ? "month" : "day" };
    }
    case "This Month":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday, groupBy: "day" };
  }
};

const toInputDate = (value = new Date()) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA");
};

export default function AdminAccountingRevenue() {
  const [period, setPeriod] = useState("This Month");
  const [customRange, setCustomRange] = useState({ from: toInputDate(), to: toInputDate() });
  const [summaryData, setSummaryData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getRange(period, customRange), [period, customRange]);

  const fetchData = useCallback(async () => {
    if (!range) return;
    try {
      setLoading(true);
      const [accountingRes, financeRes] = await Promise.allSettled([
        adminService.getAccountingSummary({
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          groupBy: range.groupBy,
        }),
        adminService.getFinanceSummary(),
      ]);
      if (accountingRes.status === "fulfilled") setSummaryData(accountingRes.value);
      if (financeRes.status === "fulfilled") {
        setRecentTransactions(financeRes.value?.recentTransactions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = summaryData?.summary || {};
  const earning = Number(summary.earning) || 0;
  const cashEarning = Number(summary.cashEarning) || 0;
  const onlineEarning = Number(summary.onlineEarning) || 0;
  const trend = (summaryData?.trend || []).map((row) => ({
    ...row,
    label: formatTrendLabel(row.period, summaryData?.range?.groupBy),
  }));

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Revenue</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting &gt; Revenue</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              {PERIODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {period === "Custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customRange.from}
                max={customRange.to || undefined}
                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={customRange.to}
                min={customRange.from || undefined}
                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {!range && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          Select a valid date range.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={loading ? "…" : formatAmount(earning)}
          icon={<IndianRupee />}
          helper={`${summary.bookingCount ?? 0} bookings this period`}
        />
        <StatCard
          title="Cash Sales"
          value={loading ? "…" : formatAmount(cashEarning)}
          icon={<Banknote />}
          helper="Collected at the hub"
        />
        <StatCard
          title="Online Sales"
          value={loading ? "…" : formatAmount(onlineEarning)}
          icon={<CreditCard />}
          helper="UPI / card / wallet / net banking"
        />
        <StatCard
          title="Security Deposit Held"
          value={loading ? "…" : formatAmount(summary.depositHeld ?? 0)}
          icon={<Wallet />}
          helper="Refundable, not counted as revenue"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{period} Revenue Trend</h3>
        <div className="h-[300px] w-full">
          {trend.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
              {loading ? "Loading revenue…" : "No revenue recorded for this period"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccountingRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#888", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#888", fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}K`} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => [formatAmount(value), "Revenue"]}
                />
                <Area type="monotone" dataKey="earning" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAccountingRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-800 text-sm text-white">
                <th className="pb-3 font-medium px-2 py-3">Transaction ID</th>
                <th className="pb-3 font-medium px-2 py-3">Booking ID</th>
                <th className="pb-3 font-medium px-2 py-3">Customer</th>
                <th className="pb-3 font-medium px-2 py-3">Amount</th>
                <th className="pb-3 font-medium px-2 py-3">Method</th>
                <th className="pb-3 font-medium px-2 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No payments recorded yet</td>
                </tr>
              )}
              {recentTransactions.map((txn, idx) => (
                <tr key={txn._id || idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2 font-medium text-gray-900">{String(txn._id || "").slice(-8) || "—"}</td>
                  <td className="py-4 px-2 text-blue-600">{txn.booking?.bookingId || "—"}</td>
                  <td className="py-4 px-2 text-gray-700">{txn.booking?.user?.fullName || txn.booking?.user?.name || "—"}</td>
                  <td className="py-4 px-2 font-semibold text-gray-900">{formatAmount(txn.amount)}</td>
                  <td className="py-4 px-2 text-gray-600">{txn.method || "—"}</td>
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
