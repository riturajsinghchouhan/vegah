import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import {
  Calendar,
  IndianRupee,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
} from "lucide-react";
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
import StatCard from "../../../shared/components/admin/StatCard";

const PERIODS = ["Today", "This Week", "This Month", "This Year", "Custom"];

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

const PAYMENT_MODE_LABELS = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const formatAmount = (n) =>
  Number.isFinite(Number(n))
    ? `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "—";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// YYYY-MM-DD in the browser's own calendar, for <input type="date">.
const toInputDate = (value = new Date()) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA");
};

const formatTrendLabel = (period, groupBy) => {
  const [y, m, d] = String(period).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return groupBy === "month"
    ? date.toLocaleDateString("en-IN", { month: "short" })
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Weeks start on Monday; every range runs up to the end of today.
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

const emptyForm = () => ({
  title: "",
  amount: "",
  category: "OTHER",
  paymentMode: "CASH",
  date: toInputDate(),
  notes: "",
});

export default function AdminAccounting() {
  const [period, setPeriod] = useState("This Month");
  const [customRange, setCustomRange] = useState({ from: toInputDate(), to: toInputDate() });
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listLoading, setListLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const range = useMemo(() => getRange(period, customRange), [period, customRange]);
  const rangeParams = useMemo(
    () => (range ? { from: range.from.toISOString(), to: range.to.toISOString() } : null),
    [range]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [rangeParams, categoryFilter, debouncedSearch]);

  const fetchSummary = useCallback(async () => {
    if (!rangeParams) return;
    try {
      setSummaryLoading(true);
      const data = await adminService.getAccountingSummary({ ...rangeParams, groupBy: range.groupBy });
      setSummaryData(data);
    } catch (err) {
      console.error("Error fetching accounting summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [rangeParams, range]);

  const fetchExpenses = useCallback(async () => {
    if (!rangeParams) return;
    try {
      setListLoading(true);
      const params = { ...rangeParams, page, limit: 15 };
      if (categoryFilter) params.category = categoryFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await adminService.getExpenses(params);
      setExpenses(res.expenses);
      setMeta(res.meta);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setListLoading(false);
    }
  }, [rangeParams, page, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const summary = summaryData?.summary || {};
  const earning = Number(summary.earning) || 0;
  const netEarning = Number(summary.netEarning) || 0;
  const trend = (summaryData?.trend || []).map((row) => ({
    ...row,
    label: formatTrendLabel(row.period, summaryData?.range?.groupBy),
  }));
  const byCategory = summaryData?.expenseByCategory || [];
  const totalExpense = Number(summary.totalExpense) || 0;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "OTHER",
      paymentMode: expense.paymentMode || "CASH",
      date: toInputDate(expense.date),
      notes: expense.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) return setFormError("Title is required");
    if (!Number.isFinite(amount) || amount <= 0) return setFormError("Enter a valid amount");
    if (!form.date) return setFormError("Date is required");

    const payload = { ...form, title: form.title.trim(), amount };
    try {
      setSaving(true);
      setFormError("");
      if (editingId) await adminService.updateExpense(editingId, payload);
      else await adminService.createExpense(payload);
      setModalOpen(false);
      fetchSummary();
      fetchExpenses();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.title}" of ${formatAmount(expense.amount)}?`)) return;
    try {
      await adminService.deleteExpense(expense._id);
      fetchSummary();
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accounting</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting</p>
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

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {!range && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          Select a valid date range.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Booking Earning"
          value={summaryLoading ? "…" : formatAmount(earning)}
          icon={<IndianRupee />}
          helper={`${summary.bookingCount ?? 0} bookings · Cash ${formatAmount(summary.cashEarning ?? 0)} · Online ${formatAmount(summary.onlineEarning ?? 0)}`}
        />
        <StatCard
          title="Total Expense"
          value={summaryLoading ? "…" : `− ${formatAmount(totalExpense)}`}
          icon={<Receipt />}
          helper={`${summary.expenseCount ?? 0} entries`}
        />
        <StatCard
          title={netEarning >= 0 ? "Net Earning" : "Net Loss"}
          value={summaryLoading ? "…" : formatAmount(Math.abs(netEarning))}
          icon={netEarning >= 0 ? <TrendingUp /> : <TrendingDown />}
          helper={`${formatAmount(earning)} − ${formatAmount(totalExpense)}`}
          className={netEarning < 0 ? "ring-1 ring-red-200" : "ring-1 ring-green-200"}
        />
        <StatCard
          title="Security Deposit Held"
          value={summaryLoading ? "…" : formatAmount(summary.depositHeld ?? 0)}
          icon={<Wallet />}
          helper="Refundable, not counted as earning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Earning vs Expense</h3>
          <div className="h-[300px] w-full mt-auto">
            {trend.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                {summaryLoading ? "Loading…" : "No earnings or expenses in this period"}
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
              {summaryLoading ? "Loading…" : "No expenses recorded"}
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

      {/* Expense list */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Expenses <span className="text-sm font-normal text-gray-500">({meta.total ?? 0})</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or notes"
                className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-800 text-sm text-white">
                <th className="py-3 font-medium px-3">Date</th>
                <th className="py-3 font-medium px-3">Title</th>
                <th className="py-3 font-medium px-3">Category</th>
                <th className="py-3 font-medium px-3">Payment Mode</th>
                <th className="py-3 font-medium px-3">Amount</th>
                <th className="py-3 font-medium px-3">Notes</th>
                <th className="py-3 font-medium px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading expenses…
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No expenses in this period</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">{exp.title}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{PAYMENT_MODE_LABELS[exp.paymentMode] || exp.paymentMode || "—"}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{formatAmount(exp.amount)}</td>
                    <td className="py-3 px-3 text-gray-500 max-w-[260px] truncate" title={exp.notes || ""}>{exp.notes || "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? "Edit Expense" : "Add Expense"}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Battery charging bill"
                  maxLength={120}
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    max={toInputDate()}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={inputClass}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                    className={inputClass}
                  >
                    {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional details"
                  maxLength={500}
                  className={inputClass}
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
