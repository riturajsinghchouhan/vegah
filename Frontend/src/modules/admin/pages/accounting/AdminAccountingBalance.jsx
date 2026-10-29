import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { IndianRupee, Wallet, ArrowDownRight, Clock, Loader2 } from "lucide-react";
import StatCard from "../../../../shared/components/admin/StatCard";

const formatAmount = (n) =>
  Number.isFinite(Number(n)) ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatusBadge = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
    case "PROCESSING":
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Processing</span>;
    case "COMPLETED":
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Completed</span>;
    case "REJECTED":
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">Rejected</span>;
    default:
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">{status || "—"}</span>;
  }
};

// Same source Accounting > Overview uses (earning − expense), just widened to
// an all-time range instead of "This Month" so Balance reads as a running total.
const ALL_TIME_FROM = new Date(2000, 0, 1).toISOString();

export default function AdminAccountingBalance() {
  const [accountingSummary, setAccountingSummary] = useState(null);
  const [walletSummary, setWalletSummary] = useState({});
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [accountingRes, walletRes, refundsRes] = await Promise.allSettled([
          adminService.getAccountingSummary({ from: ALL_TIME_FROM, to: new Date().toISOString() }),
          adminService.getAdminWalletSummary(),
          adminService.getRefunds({ status: "PENDING", limit: 50 }),
        ]);
        if (accountingRes.status === "fulfilled") setAccountingSummary(accountingRes.value);
        if (walletRes.status === "fulfilled") setWalletSummary(walletRes.value?.summary || {});
        if (refundsRes.status === "fulfilled") {
          const data = refundsRes.value;
          setRefunds(Array.isArray(data) ? data : data?.refunds || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = accountingSummary?.summary || {};
  const earning = Number(summary.earning) || 0;
  const totalExpense = Number(summary.totalExpense) || 0;
  const netEarning = Number(summary.netEarning) || 0;
  const walletLiability = Number(walletSummary.totalWalletBalance) || 0;
  const availableBalance = netEarning - walletLiability;
  const pendingRefundTotal = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Balance</h1>
        <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting &gt; Balance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Balance"
          value={loading ? "…" : formatAmount(availableBalance)}
          icon={<IndianRupee />}
          helper="Net earning less customer wallet credit"
        />
        <StatCard
          title="Net Earning"
          value={loading ? "…" : formatAmount(netEarning)}
          icon={<Wallet />}
          helper={`${formatAmount(earning)} earning − ${formatAmount(totalExpense)} expense`}
        />
        <StatCard
          title="Customer Wallet Credit"
          value={loading ? "…" : formatAmount(walletLiability)}
          icon={<Wallet />}
          helper="Owed back to customers"
        />
        <StatCard
          title="Refunds Due"
          value={loading ? "…" : formatAmount(pendingRefundTotal)}
          icon={<ArrowDownRight />}
          helper={`${refunds.length} pending request${refunds.length === 1 ? "" : "s"}`}
          className={refunds.length > 0 ? "ring-1 ring-yellow-200" : undefined}
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            Refunds to pay out
          </h3>
          <span className="text-sm text-gray-500">{refunds.length} pending</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-800 text-sm text-white">
                <th className="py-3 font-medium px-3">Customer</th>
                <th className="py-3 font-medium px-3">Booking</th>
                <th className="py-3 font-medium px-3">Amount</th>
                <th className="py-3 font-medium px-3">Reason</th>
                <th className="py-3 font-medium px-3">Requested</th>
                <th className="py-3 font-medium px-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading refunds…
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No refunds pending — balance is fully settled</td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-900">
                      {refund.booking?.user?.fullName || refund.booking?.user?.name || "Customer"}
                    </td>
                    <td className="py-3 px-3 text-blue-600">{refund.booking?.bookingId || "—"}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{formatAmount(refund.amount)}</td>
                    <td className="py-3 px-3 text-gray-600">{refund.reason || "—"}</td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(refund.createdAt)}</td>
                    <td className="py-3 px-3">{getStatusBadge(refund.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
