import React, { useCallback, useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { CheckCircle2, AlertTriangle, Loader2, Printer, FileDown, FileSpreadsheet, Calendar } from "lucide-react";

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
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const Rows = ({ rows, emptyText }) => {
  if (!rows?.length) {
    return <p className="py-3 text-sm text-gray-400 italic">{emptyText}</p>;
  }
  return rows.map((row) => (
    <div key={row.key || row.code} className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="min-w-0 text-sm text-gray-700">{row.name}</span>
      <span className="shrink-0 text-sm font-medium text-gray-900 tabular-nums">{money(row.amount)}</span>
    </div>
  ));
};

export default function AdminBalanceSheet() {
  const [asOf, setAsOf] = useState(todayStr());
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getLedgerBalanceSheet({ asOf });
      setSheet(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load the balance sheet. If no accounts exist yet, install the chart of accounts from Accounting > Ledger > Controls."
      );
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (kind) => {
    setBusy(kind);
    try {
      if (kind === "pdf") await adminService.downloadBalanceSheetPdf({ asOf });
      else await adminService.downloadBalanceSheetExcel({ asOf });
    } catch (err) {
      setError(err?.response?.data?.message || "Download failed");
    } finally {
      setBusy(null);
    }
  };

  const equityRows = sheet?.equity || [];

  return (
    <div className="space-y-6 pb-8 max-w-[1100px] mx-auto">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Balance Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Accounting &gt; Balance Sheet</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={asOf}
              max={todayStr()}
              onChange={(e) => setAsOf(e.target.value)}
              className="pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={() => download("pdf")}
            disabled={busy === "pdf"}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
          >
            {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            PDF
          </button>
          <button
            onClick={() => download("excel")}
            disabled={busy === "excel"}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
          >
            {busy === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="no-print flex items-center justify-center py-16 text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading balance sheet…
        </div>
      ) : (
        <div className="print-area bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wide text-gray-900">VEGAH EV RENTALS</h2>
            <p className="text-sm font-semibold text-gray-700 mt-1">BALANCE SHEET</p>
            <p className="text-xs text-gray-500 mt-0.5">As at {formatDate(sheet?.asOf)}</p>
          </div>

          <div
            className={`mb-6 flex items-center justify-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 w-fit mx-auto border ${
              sheet?.totals?.balanced
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-700 bg-red-50 border-red-200"
            }`}
          >
            {sheet?.totals?.balanced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Off by {money(sheet?.totals?.difference)}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-800 pb-2 mb-2">
                Liabilities & Equity
              </h3>
              <div className="divide-y divide-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mt-2 mb-1">Liabilities</p>
                  <Rows rows={sheet?.liabilities} emptyText="No liability balances." />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Capital & Equity</p>
                  <Rows rows={equityRows} emptyText="No equity balances." />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-3 mt-2 border-t-2 border-gray-800">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900 tabular-nums">
                  {money(sheet?.totals?.liabilitiesAndEquity)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-800 pb-2 mb-2">
                Assets
              </h3>
              <Rows rows={sheet?.assets} emptyText="No asset balances." />
              <div className="flex items-baseline justify-between gap-4 pt-3 mt-2 border-t-2 border-gray-800">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900 tabular-nums">{money(sheet?.totals?.assets)}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 flex justify-end">
            <div className="text-center">
              <div className="border-t border-gray-400 w-40 mb-1" />
              <p className="text-xs text-gray-500">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
