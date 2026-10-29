import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import { IndianRupee, Receipt, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatCard from "../../../../shared/components/admin/StatCard";

const PERIODS = ["Weekly", "Monthly", "Yearly"];

const CATEGORY_LABELS = {
  CHARGING: "Charging / Electricity",
  MAINTENANCE: "Maintenance",
  REPAIR: "Repair",
  SALARY: "Salary",
  RENT: "Rent",
  UTILITIES: "Utilities",
  INSURANCE: "Insurance",
  MARKETING: "Marketing",
  TRANSPORT: "Transport",
  OFFICE: "Office",
  OTHER: "Other",
};

const formatAmount = (n) =>
  Number.isFinite(Number(n)) ? `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—";

const formatTrendLabel = (period, groupBy) => {
  const [y, m, d] = String(period).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return groupBy === "month"
    ? date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const getRange = (period) => {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "Weekly": {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { from, to: endOfToday, groupBy: "day" };
    }
    case "Yearly":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday, groupBy: "month" };
    case "Monthly":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday, groupBy: "day" };
  }
};

export default function AdminAccountingProfitLoss() {
  const [period, setPeriod] = useState("Monthly");
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getRange(period), [period]);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAccountingSummary({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        groupBy: range.groupBy,
      });
      setSummaryData(data);
    } catch (err) {
      console.error("Error fetching P&L summary:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const summary = summaryData?.summary || {};
  const earning = Number(summary.earning) || 0;
  const totalExpense = Number(summary.totalExpense) || 0;
  const netEarning = Number(summary.netEarning) || 0;
  const isProfit = netEarning >= 0;
  const trend = (summaryData?.trend || []).map((row) => ({
    ...row,
    label: formatTrendLabel(row.period, summaryData?.range?.groupBy),
  }));
  const byCategory = summaryData?.expenseByCategory || [];

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profit &amp; Loss</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting &gt; Profit &amp; Loss</p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Earning"
          value={loading ? "…" : formatAmount(earning)}
          icon={<IndianRupee />}
          helper={`${summary.bookingCount ?? 0} bookings this period`}
        />
        <StatCard
          title="Expense"
          value={loading ? "…" : `− ${formatAmount(totalExpense)}`}
          icon={<Receipt />}
          helper={`${summary.expenseCount ?? 0} entries`}
        />
        <StatCard
          title={isProfit ? "Net Profit" : "Net Loss"}
          value={loading ? "…" : formatAmount(Math.abs(netEarning))}
          icon={isProfit ? <TrendingUp /> : <TrendingDown />}
          helper={`${formatAmount(earning)} − ${formatAmount(totalExpense)}`}
          className={isProfit ? "ring-1 ring-green-200" : "ring-1 ring-red-200"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{period} Earning vs Expense</h3>
          <div className="h-[320px] w-full mt-auto">
            {trend.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                {loading ? "Loading…" : "No earnings or expenses in this period"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#888", fontSize: 12 }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(val) => (Math.abs(val) >= 1000 ? `₹${val / 1000}K` : `₹${val}`)}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value, name) => [formatAmount(value), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="earning" name="Earning" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense by Category</h3>
          {byCategory.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
              {loading ? "Loading…" : "No expenses recorded"}
            </div>
          ) : (
            <div className="space-y-4">
              {byCategory.map((row) => {
                const share = totalExpense ? Math.round((row.total / totalExpense) * 100) : 0;
                return (
                  <div key={row.category}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-700 font-medium">{CATEGORY_LABELS[row.category] || row.category}</span>
                      <span className="text-gray-900 font-semibold">
                        {formatAmount(row.total)} <span className="text-gray-400 font-normal">({share}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
