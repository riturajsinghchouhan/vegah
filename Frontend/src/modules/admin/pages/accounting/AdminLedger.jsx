import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Lock,
  Unlock,
  Plus,
  Trash2,
} from "lucide-react";
import StatCard from "../../../../shared/components/admin/StatCard";

const TABS = [
  { id: "balance-sheet", label: "Balance Sheet", csv: "balance-sheet" },
  { id: "profit-loss", label: "Profit & Loss", csv: "profit-loss" },
  { id: "receipts-payments", label: "Receipts & Payments", csv: "receipts-payments" },
  { id: "trial-balance", label: "Trial Balance", csv: "trial-balance" },
  { id: "journal", label: "Journal", csv: "journal" },
  { id: "accounts", label: "Chart of Accounts" },
  { id: "controls", label: "Controls" },
];

const PERIODS = ["This Month", "This Year", "All Time"];

const money = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "−" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
};

const getRange = (period) => {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (period === "This Year") return { from: new Date(now.getFullYear(), 0, 1), to };
  if (period === "All Time") return { from: new Date(2000, 0, 1), to };
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
};

const EVENT_LABELS = {
  E1_BOOKING_CONFIRMED: "Booking invoiced",
  E2_REVENUE_RECOGNISED: "Revenue recognised",
  E3_PAYMENT_CAPTURED: "Payment captured",
  E4_GATEWAY_SETTLEMENT: "Gateway settlement",
  E5_CASH_COLLECTED: "Cash collected",
  E6_CASH_HANDOVER: "Cash handover",
  E7_WALLET_TOP_UP: "Wallet top-up",
  E8_PAID_FROM_WALLET: "Paid from wallet",
  E9_DEPOSIT_REFUNDED: "Deposit refunded",
  E13_REFUND_PAID: "Refund paid",
  E17_EXPENSE_PAID: "Expense paid",
  E20_BAD_DEBT: "Bad debt",
  E22_UNMATCHED_RECEIPT: "Unmatched receipt",
};

const eventLabel = (type) =>
  EVENT_LABELS[type] || (type?.startsWith("REVERSAL:") ? "Reversal" : type);

/* ---------- small building blocks ---------- */

const Panel = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const LineRows = ({ rows, emptyText }) => {
  if (!rows?.length) {
    return <p className="px-6 py-6 text-sm text-gray-500">{emptyText}</p>;
  }
  return (
    <div className="divide-y divide-gray-50">
      {rows.map((row) => (
        <div key={row.key || row.code} className="flex items-baseline justify-between gap-4 px-6 py-2.5">
          <span className="min-w-0 text-sm text-gray-700">
            <span className="font-mono text-xs text-gray-400 mr-2">{row.code}</span>
            {row.name}
          </span>
          <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">{money(row.amount)}</span>
        </div>
      ))}
    </div>
  );
};

const TotalRow = ({ label, value, strong }) => (
  <div
    className={`flex items-baseline justify-between gap-4 px-6 py-3 border-t ${
      strong ? "border-gray-300 bg-gray-50" : "border-gray-100"
    }`}
  >
    <span className={`text-sm ${strong ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{label}</span>
    <span className={`tabular-nums ${strong ? "text-base font-bold text-gray-900" : "text-sm font-semibold text-gray-900"}`}>
      {money(value)}
    </span>
  </div>
);

/* ---------- page ---------- */

export default function AdminLedger() {
  const [tab, setTab] = useState("balance-sheet");
  const [period, setPeriod] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [check, setCheck] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [cash, setCash] = useState(null);
  const [journal, setJournal] = useState({ entries: [], meta: {} });
  const [trial, setTrial] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [openEntry, setOpenEntry] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState({ cashInHand: 0, awaitingSettlement: 0 });

  // Money reaches the bank two ways: hub cash banked, and Razorpay remitting
  // online payments net of its fees.
  const [handover, setHandover] = useState({ amount: "", reference: "", date: new Date().toISOString().slice(0, 10) });
  const [settlement, setSettlement] = useState({
    grossSettled: "", gatewayFee: "", gstOnFee: "", reference: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // Manual voucher form. Two lines is the minimum a journal entry can have.
  const [voucher, setVoucher] = useState({
    narration: "",
    date: new Date().toISOString().slice(0, 10),
    lines: [
      { accountKey: "", debit: "", credit: "" },
      { accountKey: "", debit: "", credit: "" },
    ],
  });

  const range = useMemo(() => getRange(period), [period]);

  const voucherTotals = useMemo(() => {
    const dr = voucher.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const cr = voucher.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { dr, cr, balanced: dr > 0 && Math.abs(dr - cr) < 0.005 };
  }, [voucher.lines]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { from: range.from.toISOString(), to: range.to.toISOString() };
    try {
      const [checkRes, sheetRes, pnlRes, cashRes, journalRes, trialRes, accountsRes, periodsRes, pendingRes] =
        await Promise.allSettled([
          adminService.getLedgerDailyCheck(),
          adminService.getLedgerBalanceSheet({ asOf: params.to }),
          adminService.getLedgerProfitLoss(params),
          adminService.getLedgerReceiptsPayments(params),
          adminService.getLedgerJournal({ ...params, limit: 50 }),
          adminService.getLedgerTrialBalance({ to: params.to }),
          adminService.getLedgerAccounts(),
          adminService.getLedgerPeriods(),
          adminService.getLedgerPendingMoney(),
        ]);

      if (checkRes.status === "fulfilled") setCheck(checkRes.value);
      if (sheetRes.status === "fulfilled") setSheet(sheetRes.value);
      if (pnlRes.status === "fulfilled") setPnl(pnlRes.value);
      if (cashRes.status === "fulfilled") setCash(cashRes.value);
      if (journalRes.status === "fulfilled") setJournal(journalRes.value);
      if (trialRes.status === "fulfilled") setTrial(trialRes.value);
      if (accountsRes.status === "fulfilled") setAccounts(accountsRes.value || []);
      if (periodsRes.status === "fulfilled") setPeriods(periodsRes.value || []);
      if (pendingRes.status === "fulfilled") setPending(pendingRes.value || { cashInHand: 0, awaitingSettlement: 0 });

      if (sheetRes.status === "rejected") {
        setError(
          sheetRes.reason?.response?.data?.message ||
            "Could not load the ledger. If no accounts exist yet, the chart of accounts has not been installed."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (label, fn) => {
    setBusy(label);
    setNotice(null);
    try {
      const message = await fn();
      setNotice({ kind: "ok", text: message });
      await load();
    } catch (err) {
      setNotice({ kind: "error", text: err?.response?.data?.message || err.message || "Something went wrong" });
    } finally {
      setBusy(null);
    }
  };

  const submitVoucher = () =>
    run("voucher", async () => {
      const lines = voucher.lines
        .filter((l) => l.accountKey && (Number(l.debit) > 0 || Number(l.credit) > 0))
        .map((l) => ({
          accountKey: l.accountKey,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        }));
      const entry = await adminService.postLedgerVoucher({
        narration: voucher.narration,
        date: voucher.date,
        lines,
      });
      setVoucher({
        narration: "",
        date: new Date().toISOString().slice(0, 10),
        lines: [
          { accountKey: "", debit: "", credit: "" },
          { accountKey: "", debit: "", credit: "" },
        ],
      });
      return `Voucher ${entry.entryNo} posted.`;
    });

  const setLine = (index, field, value) =>
    setVoucher((v) => ({
      ...v,
      lines: v.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));

  const activeTab = TABS.find((t) => t.id === tab);
  const isEmpty = !loading && (journal.meta?.total ?? 0) === 0;

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting &gt; Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab?.csv && (
            <button
              onClick={() =>
                run("export", async () => {
                  await adminService.downloadLedgerCsv(activeTab.csv, {
                    from: range.from.toISOString(),
                    to: range.to.toISOString(),
                  });
                  return `${activeTab.label} exported to CSV.`;
                })
              }
              disabled={busy === "export"}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
            >
              {busy === "export" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
          )}
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
      </div>

      {notice && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-5 py-3 ${
            notice.kind === "ok" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}
        >
          {notice.kind === "ok" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${notice.kind === "ok" ? "text-green-900" : "text-red-800"}`}>{notice.text}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* daily balance check */}
      {check && (
        <div
          className={`rounded-xl border px-5 py-4 ${
            check.status === "BALANCED" ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {check.status === "BALANCED" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${check.status === "BALANCED" ? "text-green-900" : "text-yellow-900"}`}>
                {check.status === "BALANCED"
                  ? "Balanced"
                  : `${check.exceptions.length} exception${check.exceptions.length === 1 ? "" : "s"}`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Checked: {check.checked.join(" · ")}
              </p>
              {check.exceptions?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {check.exceptions.map((ex) => (
                    <li key={ex.check} className="text-sm text-yellow-900">
                      <span className="font-medium">{ex.check}:</span> {ex.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* headline figures */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={loading ? "…" : money(sheet?.totals?.assets)}
          icon={<Scale />}
          helper={sheet?.totals?.balanced ? "Balance sheet balances" : "Does not balance"}
          className={sheet && !sheet.totals.balanced ? "ring-1 ring-red-200" : undefined}
        />
        <StatCard
          title="Income"
          value={loading ? "…" : money(pnl?.totals?.income)}
          icon={<TrendingUp />}
          helper={period}
        />
        <StatCard
          title={Number(pnl?.totals?.netProfit) >= 0 ? "Net Profit" : "Net Loss"}
          value={loading ? "…" : money(Math.abs(Number(pnl?.totals?.netProfit) || 0))}
          icon={Number(pnl?.totals?.netProfit) >= 0 ? <TrendingUp /> : <TrendingDown />}
          helper={`after ${money(Number(pnl?.totals?.directCosts) + Number(pnl?.totals?.operatingExpenses) || 0)} of costs`}
        />
        <StatCard
          title="Cash & Bank"
          value={loading ? "…" : money(cash?.totals?.closing)}
          icon={<BookOpen />}
          helper={
            pending.cashInHand + pending.awaitingSettlement > 0
              ? `${money(pending.cashInHand)} in hand · ${money(pending.awaitingSettlement)} awaiting Razorpay`
              : cash?.totals?.reconciles
                ? "All banked, movement explained"
                : "Movement unexplained"
          }
        />
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading ledger…
        </div>
      ) : isEmpty && !["accounts", "controls"].includes(tab) ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No journal entries yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            All three statements are generated from the ledger, so they stay empty until business events start
            posting entries. {accounts.length === 0 && "Install the chart of accounts from the Controls tab first."}
          </p>
        </div>
      ) : (
        <>
          {/* ---- balance sheet ---- */}
          {tab === "balance-sheet" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Panel title="Assets" subtitle={`As at ${formatDate(sheet?.asOf)}`}>
                <LineRows rows={sheet?.assets} emptyText="No asset balances. Vehicles and batteries are not yet tracked as fixed assets." />
                <TotalRow label="Total assets" value={sheet?.totals?.assets} strong />
              </Panel>

              <div className="space-y-6">
                <Panel title="Liabilities">
                  <LineRows rows={sheet?.liabilities} emptyText="No liability balances." />
                  <TotalRow label="Total liabilities" value={sheet?.totals?.liabilities} />
                </Panel>
                <Panel title="Equity">
                  <LineRows rows={sheet?.equity} emptyText="No equity balances." />
                  <TotalRow label="Total equity" value={sheet?.totals?.equity} />
                </Panel>
                <Panel
                  title="Liabilities + Equity"
                  right={
                    sheet?.totals?.balanced ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Balances
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Off by {money(sheet?.totals?.difference)}
                      </span>
                    )
                  }
                >
                  <TotalRow label="Total liabilities and equity" value={sheet?.totals?.liabilitiesAndEquity} strong />
                </Panel>
              </div>
            </div>
          )}

          {/* ---- profit & loss ---- */}
          {tab === "profit-loss" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Panel title="Income" subtitle={period}>
                <LineRows rows={pnl?.income} emptyText="No income recognised in this period." />
                <TotalRow label="Total income" value={pnl?.totals?.income} strong />
              </Panel>
              <div className="space-y-6">
                <Panel title="Direct Costs">
                  <LineRows rows={pnl?.directCosts} emptyText="No direct costs recorded. Swap station charges are not yet captured." />
                  <TotalRow label="Gross profit" value={pnl?.totals?.grossProfit} />
                </Panel>
                <Panel title="Operating Expenses">
                  <LineRows rows={pnl?.operatingExpenses} emptyText="No operating expenses in this period." />
                  <TotalRow label="Total operating expenses" value={pnl?.totals?.operatingExpenses} />
                </Panel>
                <Panel title={Number(pnl?.totals?.netProfit) >= 0 ? "Net Profit" : "Net Loss"}>
                  <TotalRow
                    label={`Income less all costs — ${period}`}
                    value={pnl?.totals?.netProfit}
                    strong
                  />
                </Panel>
              </div>
            </div>
          )}

          {/* ---- receipts & payments ---- */}
          {tab === "receipts-payments" && (
            <div className="space-y-6">
              <Panel
                title="Cash movement"
                subtitle={`${cash?.cashAccounts?.map((a) => a.name).join(" · ") || "Cash and bank"} — ${period}`}
                right={
                  cash?.totals?.reconciles ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Explained
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Unexplained
                    </span>
                  )
                }
              >
                <TotalRow label="Opening balance" value={cash?.totals?.opening} />
                <TotalRow label="Add: receipts" value={cash?.totals?.receipts} />
                <TotalRow label="Less: payments" value={cash?.totals?.payments} />
                <TotalRow label="Closing balance" value={cash?.totals?.closing} strong />
              </Panel>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Panel
                  title="Receipts"
                  subtitle="Money in, by what it was for"
                  right={<ArrowDownLeft className="w-4 h-4 text-green-600" />}
                >
                  <LineRows rows={cash?.receipts} emptyText="No receipts in this period." />
                  <TotalRow label="Total receipts" value={cash?.totals?.receipts} strong />
                </Panel>
                <Panel
                  title="Payments"
                  subtitle="Money out, by what it was for"
                  right={<ArrowUpRight className="w-4 h-4 text-orange-600" />}
                >
                  <LineRows rows={cash?.payments} emptyText="No payments in this period." />
                  <TotalRow label="Total payments" value={cash?.totals?.payments} strong />
                </Panel>
              </div>
            </div>
          )}

          {/* ---- trial balance ---- */}
          {tab === "trial-balance" && (
            <Panel
              title="Trial Balance"
              subtitle={`Every account with movement, as at ${formatDate(range.to)}`}
              right={
                trial?.totals?.balanced ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Debits = Credits
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Off by {money(trial?.totals?.difference)}
                  </span>
                )
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-3 font-medium px-4">Code</th>
                      <th className="py-3 font-medium px-4">Account</th>
                      <th className="py-3 font-medium px-4">Type</th>
                      <th className="py-3 font-medium px-4 text-right">Debit</th>
                      <th className="py-3 font-medium px-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {(trial?.accounts || []).map((a) => (
                      <tr key={a.code} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{a.code}</td>
                        <td className="py-2.5 px-4 text-gray-800">{a.name}</td>
                        <td className="py-2.5 px-4 text-gray-500 text-xs uppercase tracking-wide">{a.type}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-gray-900">{a.debit ? money(a.debit) : ""}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-gray-900">{a.credit ? money(a.credit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-sm">
                      <td className="py-3 px-4" colSpan={3}>Totals</td>
                      <td className="py-3 px-4 text-right tabular-nums">{money(trial?.totals?.debit)}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{money(trial?.totals?.credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          )}

          {/* ---- chart of accounts ---- */}
          {tab === "accounts" && (
            <Panel
              title="Chart of Accounts"
              subtitle={`${accounts.length} accounts. Posting rules reference the key, so codes can be renumbered freely.`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-3 font-medium px-4">Code</th>
                      <th className="py-3 font-medium px-4">Account</th>
                      <th className="py-3 font-medium px-4">Key</th>
                      <th className="py-3 font-medium px-4">Type</th>
                      <th className="py-3 font-medium px-4">Normal side</th>
                      <th className="py-3 font-medium px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No accounts installed. Use the Controls tab to install the chart of accounts.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((a) => (
                        <tr key={a.key} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{a.code}</td>
                          <td className="py-2.5 px-4 text-gray-800">{a.name}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-gray-400">{a.key}</td>
                          <td className="py-2.5 px-4 text-gray-600 text-xs uppercase tracking-wide">{a.type}</td>
                          <td className="py-2.5 px-4 text-gray-600 text-xs">{a.normalSide}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-500">
                            {[a.isContra && "contra", a.isCash && "cash", a.subLedger && `${a.subLedger} control`]
                              .filter(Boolean)
                              .join(" · ")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* ---- controls ---- */}
          {tab === "controls" && (
            <div className="space-y-6">
              {accounts.length === 0 && (
                <Panel title="Set up the ledger" subtitle="The chart of accounts has not been installed yet.">
                  <div className="px-6 py-5">
                    <p className="text-sm text-gray-600 max-w-prose">
                      Installing writes the chart of accounts into the database. It adds what is missing and
                      refreshes names on what is already there, and never deletes an account.
                    </p>
                    <button
                      onClick={() =>
                        run("install", async () => {
                          const r = await adminService.installLedgerChart();
                          return `Chart of accounts installed: ${r.created} created, ${r.updated} updated.`;
                        })
                      }
                      disabled={busy === "install"}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy === "install" && <Loader2 className="w-4 h-4 animate-spin" />}
                      Install chart of accounts
                    </button>
                  </div>
                </Panel>
              )}

              <Panel
                title="Money into the bank"
                subtitle="Riders pay online through Razorpay or in cash at the hub. Neither reaches the bank until it is banked or remitted, so recording that is what makes the bank balance real."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  {/* cash handover */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-semibold text-gray-900">Bank the hub cash</h4>
                      <span className="text-xs text-gray-500">
                        in hand <span className="font-semibold text-gray-900 tabular-nums">{money(pending.cashInHand)}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="handover-amount"
                        type="number" min="0" step="0.01"
                        value={handover.amount}
                        onChange={(e) => setHandover((h) => ({ ...h, amount: e.target.value }))}
                        placeholder="Amount deposited"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setHandover((h) => ({ ...h, amount: String(pending.cashInHand) }))}
                        disabled={!pending.cashInHand}
                        className="shrink-0 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40"
                      >
                        All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="handover-date"
                        type="date"
                        value={handover.date}
                        onChange={(e) => setHandover((h) => ({ ...h, date: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        id="handover-ref"
                        value={handover.reference}
                        onChange={(e) => setHandover((h) => ({ ...h, reference: e.target.value }))}
                        placeholder="Slip no."
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() =>
                        run("handover", async () => {
                          const e = await adminService.recordLedgerCashHandover({
                            amount: Number(handover.amount),
                            date: handover.date,
                            reference: handover.reference || undefined,
                          });
                          setHandover({ amount: "", reference: "", date: new Date().toISOString().slice(0, 10) });
                          return `Cash handover ${e.entryNo} recorded.`;
                        })
                      }
                      disabled={busy === "handover" || !(Number(handover.amount) > 0)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy === "handover" && <Loader2 className="w-4 h-4 animate-spin" />}
                      Record handover
                    </button>
                  </div>

                  {/* gateway settlement */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-semibold text-gray-900">Record a Razorpay settlement</h4>
                      <span className="text-xs text-gray-500">
                        awaiting <span className="font-semibold text-gray-900 tabular-nums">{money(pending.awaitingSettlement)}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="settle-gross"
                        type="number" min="0" step="0.01"
                        value={settlement.grossSettled}
                        onChange={(e) => setSettlement((s) => ({ ...s, grossSettled: e.target.value }))}
                        placeholder="Gross settled"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setSettlement((s) => ({ ...s, grossSettled: String(pending.awaitingSettlement) }))}
                        disabled={!pending.awaitingSettlement}
                        className="shrink-0 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40"
                      >
                        All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="settle-fee"
                        type="number" min="0" step="0.01"
                        value={settlement.gatewayFee}
                        onChange={(e) => setSettlement((s) => ({ ...s, gatewayFee: e.target.value }))}
                        placeholder="Razorpay fee"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        id="settle-gst"
                        type="number" min="0" step="0.01"
                        value={settlement.gstOnFee}
                        onChange={(e) => setSettlement((s) => ({ ...s, gstOnFee: e.target.value }))}
                        placeholder="GST on fee"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        id="settle-date"
                        type="date"
                        value={settlement.date}
                        onChange={(e) => setSettlement((s) => ({ ...s, date: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        id="settle-ref"
                        value={settlement.reference}
                        onChange={(e) => setSettlement((s) => ({ ...s, reference: e.target.value }))}
                        placeholder="Settlement ID"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Net to bank{" "}
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {money(
                          Math.max(
                            0,
                            (Number(settlement.grossSettled) || 0) -
                              (Number(settlement.gatewayFee) || 0) -
                              (Number(settlement.gstOnFee) || 0)
                          )
                        )}
                      </span>
                    </p>
                    <button
                      onClick={() =>
                        run("settle", async () => {
                          const e = await adminService.recordLedgerGatewaySettlement({
                            grossSettled: Number(settlement.grossSettled),
                            gatewayFee: Number(settlement.gatewayFee) || 0,
                            gstOnFee: Number(settlement.gstOnFee) || 0,
                            date: settlement.date,
                            reference: settlement.reference || undefined,
                          });
                          setSettlement({
                            grossSettled: "", gatewayFee: "", gstOnFee: "", reference: "",
                            date: new Date().toISOString().slice(0, 10),
                          });
                          return `Settlement ${e.entryNo} recorded.`;
                        })
                      }
                      disabled={busy === "settle" || !(Number(settlement.grossSettled) > 0)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy === "settle" && <Loader2 className="w-4 h-4 animate-spin" />}
                      Record settlement
                    </button>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Accounting periods"
                subtitle="Once a month is closed, nothing can post into it. Reopening is recorded with a reason."
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[520px]">
                    <thead>
                      <tr className="bg-gray-800 text-sm text-white">
                        <th className="py-3 font-medium px-4">Period</th>
                        <th className="py-3 font-medium px-4">Status</th>
                        <th className="py-3 font-medium px-4">Closed</th>
                        <th className="py-3 font-medium px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {periods.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">
                            No periods recorded. Every month is open until you close it.
                          </td>
                        </tr>
                      ) : (
                        periods.map((p) => (
                          <tr key={p.periodKey} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 px-4 font-mono text-gray-800">{p.periodKey}</td>
                            <td className="py-3 px-4">
                              {p.status === "CLOSED" ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
                                  <Lock className="w-3 h-3" /> Closed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                                  <Unlock className="w-3 h-3" /> Open
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {p.closedAt ? formatDate(p.closedAt) : "—"}
                              {p.reopenedAt && ` · reopened ${formatDate(p.reopenedAt)}`}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {p.status === "CLOSED" ? (
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Why are you reopening ${p.periodKey}?`);
                                    if (reason) {
                                      run("period", async () => {
                                        await adminService.reopenLedgerPeriod(p.periodKey, reason);
                                        return `Period ${p.periodKey} reopened.`;
                                      });
                                    }
                                  }}
                                  disabled={busy === "period"}
                                  className="text-sm font-medium text-blue-700 hover:underline disabled:opacity-50"
                                >
                                  Reopen
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    run("period", async () => {
                                      await adminService.closeLedgerPeriod(p.periodKey);
                                      return `Period ${p.periodKey} closed.`;
                                    })
                                  }
                                  disabled={busy === "period"}
                                  className="text-sm font-medium text-gray-700 hover:underline disabled:opacity-50"
                                >
                                  Close
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel
                title="Journal voucher"
                subtitle="The only hand-written entry the ledger accepts. It is validated like any automatic posting and stamped with your name."
                right={
                  <span
                    className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                      voucherTotals.balanced
                        ? "text-green-700 bg-green-50 border-green-200"
                        : "text-gray-600 bg-gray-50 border-gray-200"
                    }`}
                  >
                    Dr {money(voucherTotals.dr)} / Cr {money(voucherTotals.cr)}
                  </span>
                }
              >
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="voucher-narration" className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Narration
                      </label>
                      <input
                        id="voucher-narration"
                        value={voucher.narration}
                        onChange={(e) => setVoucher((v) => ({ ...v, narration: e.target.value }))}
                        placeholder="What is this entry for?"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="voucher-date" className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Date
                      </label>
                      <input
                        id="voucher-date"
                        type="date"
                        value={voucher.date}
                        onChange={(e) => setVoucher((v) => ({ ...v, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {voucher.lines.map((line, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <select
                          value={line.accountKey}
                          onChange={(e) => setLine(i, "accountKey", e.target.value)}
                          className="col-span-12 sm:col-span-6 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select account…</option>
                          {accounts.map((a) => (
                            <option key={a.key} value={a.key}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => setLine(i, "debit", e.target.value)}
                          placeholder="Debit"
                          className="col-span-5 sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => setLine(i, "credit", e.target.value)}
                          placeholder="Credit"
                          className="col-span-5 sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() =>
                            setVoucher((v) => ({
                              ...v,
                              lines: v.lines.length > 2 ? v.lines.filter((_, j) => j !== i) : v.lines,
                            }))
                          }
                          disabled={voucher.lines.length <= 2}
                          title={voucher.lines.length <= 2 ? "An entry needs at least two lines" : "Remove line"}
                          className="col-span-2 sm:col-span-2 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() =>
                        setVoucher((v) => ({ ...v, lines: [...v.lines, { accountKey: "", debit: "", credit: "" }] }))
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add line
                    </button>
                    <div className="flex-1" />
                    {!voucherTotals.balanced && voucherTotals.dr + voucherTotals.cr > 0 && (
                      <span className="text-xs text-gray-500">Debits must equal credits before this can post</span>
                    )}
                    <button
                      onClick={submitVoucher}
                      disabled={busy === "voucher" || !voucherTotals.balanced || !voucher.narration.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy === "voucher" && <Loader2 className="w-4 h-4 animate-spin" />}
                      Post voucher
                    </button>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* ---- journal ---- */}
          {tab === "journal" && (
            <Panel
              title="Journal"
              subtitle={`${journal.meta?.total ?? 0} entries — newest first. Entries are immutable; corrections appear as reversals.`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-3 font-medium px-4">Entry</th>
                      <th className="py-3 font-medium px-4">Date</th>
                      <th className="py-3 font-medium px-4">Event</th>
                      <th className="py-3 font-medium px-4">Narration</th>
                      <th className="py-3 font-medium px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {journal.entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No entries in this period
                        </td>
                      </tr>
                    ) : (
                      journal.entries.map((entry) => (
                        <React.Fragment key={entry._id}>
                          <tr
                            onClick={() => setOpenEntry(openEntry === entry._id ? null : entry._id)}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-xs text-blue-700">{entry.entryNo}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(entry.date)}</td>
                            <td className="py-3 px-4">
                              <span className="text-gray-800">{eventLabel(entry.eventType)}</span>
                              {entry.isReversal && (
                                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                                  reversal
                                </span>
                              )}
                              {entry.isReversed && (
                                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                                  reversed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{entry.narration}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">
                              {money(entry.totalDebit)}
                            </td>
                          </tr>
                          {openEntry === entry._id && (
                            <tr className="bg-gray-50/80">
                              <td colSpan={5} className="px-4 py-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-500">
                                      <th className="text-left font-semibold py-1.5">Account</th>
                                      <th className="text-right font-semibold py-1.5 w-32">Debit</th>
                                      <th className="text-right font-semibold py-1.5 w-32">Credit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.lines.map((l, i) => (
                                      <tr key={i} className="border-t border-gray-200/70">
                                        <td className="py-1.5 text-gray-700">
                                          <span className="font-mono text-xs text-gray-400 mr-2">{l.accountCode}</span>
                                          {l.accountKey}
                                        </td>
                                        <td className="py-1.5 text-right tabular-nums text-gray-900">
                                          {l.debit ? money(l.debit) : ""}
                                        </td>
                                        <td className="py-1.5 text-right tabular-nums text-gray-900">
                                          {l.credit ? money(l.credit) : ""}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-300 font-bold">
                                      <td className="py-1.5 text-gray-900">Total</td>
                                      <td className="py-1.5 text-right tabular-nums">{money(entry.totalDebit)}</td>
                                      <td className="py-1.5 text-right tabular-nums">{money(entry.totalCredit)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="flex items-center justify-between gap-4 pt-3 mt-1 border-t border-gray-200/70">
                                  <p className="text-xs text-gray-500">
                                    Posted by {entry.postedByType === "ADMIN" ? "an admin" : "the system"} · {entry.periodKey}
                                    {" · entries cannot be edited, only reversed"}
                                  </p>
                                  {!entry.isReversal && !entry.isReversed && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const reason = window.prompt(`Why are you reversing ${entry.entryNo}?`);
                                        if (reason) {
                                          run("reverse", async () => {
                                            const r = await adminService.reverseLedgerEntry(entry._id, reason);
                                            return `Reversal ${r.entryNo} posted against ${entry.entryNo}.`;
                                          });
                                        }
                                      }}
                                      disabled={busy === "reverse"}
                                      className="shrink-0 text-sm font-medium text-orange-700 hover:underline disabled:opacity-50"
                                    >
                                      Reverse this entry
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
