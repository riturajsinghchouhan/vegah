import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2, Receipt, Search, Undo2, XCircle } from "lucide-react";
import { adminService } from "../../services/adminService";

/**
 * The GST register: every tax invoice and credit note, and the period totals
 * the CA files from.
 *
 * There is no edit or delete anywhere on this screen by design. An issued tax
 * invoice carries a filed number, so the only correction offered is a credit
 * note against it.
 */

const money = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "−" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const Panel = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const SummaryTile = ({ label, value, hint }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-lg font-semibold text-gray-900 tabular-nums mt-0.5">{value}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const CreditNoteDialog = ({ invoice, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminService.issueGstCreditNote(invoice._id, {
        reason: reason.trim(),
        amount: amount === "" ? null : Number(amount),
      });
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Credit note</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Against {invoice.invoiceNumber} · {money(invoice.totalAmount)}
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-700 mb-1">Reason</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Booking cancelled after invoicing"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-700 mb-1">Amount</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Full value (${invoice.totalAmount})`}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
            <span className="block text-[11px] text-gray-400 mt-1">
              Leave blank to credit the whole invoice.
            </span>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
            Issue credit note
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminGstDocuments = () => {
  const [range, setRange] = useState({ from: monthStartISO(), to: todayISO() });
  const [filter, setFilter] = useState({ documentType: "", search: "" });
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crediting, setCrediting] = useState(null);
  const [message, setMessage] = useState(null);

  const notify = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...range };
      if (filter.documentType) params.documentType = filter.documentType;
      if (filter.search) params.search = filter.search;

      const [docs, sum] = await Promise.all([
        adminService.getGstDocuments({ ...params, limit: 100 }),
        adminService.getGstSummary(range),
      ]);
      setDocuments(docs.data || []);
      setSummary(sum);
    } catch (error) {
      notify("error", error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [range, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">GST Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tax invoices and credit notes, numbered per financial year. Issued documents cannot be edited or deleted.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {message.type === "error" ? <XCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-gray-700 mb-1">From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-700 mb-1">To</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-700 mb-1">Type</span>
          <select
            value={filter.documentType}
            onChange={(e) => setFilter((f) => ({ ...f, documentType: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="INVOICE">Tax invoices</option>
            <option value="CREDIT_NOTE">Credit notes</option>
          </select>
        </label>
        <label className="block flex-1 min-w-[200px]">
          <span className="block text-xs font-medium text-gray-700 mb-1">Search</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              placeholder="Invoice no., booking or customer"
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </label>
      </div>

      {summary && (
        <Panel title="Period summary" subtitle="Output tax for the range, net of credit notes.">
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Taxable value"
              value={money(summary.net.taxableValue)}
              hint={`${summary.b2bInvoices.count} B2B · ${summary.b2cInvoices.count} B2C`}
            />
            <SummaryTile label="CGST + SGST" value={money(summary.net.cgst + summary.net.sgst)} />
            <SummaryTile label="IGST" value={money(summary.net.igst)} />
            <SummaryTile
              label="Total output tax"
              value={money(summary.net.outputTax)}
              hint={`less ${summary.creditNotes.count} credit note(s)`}
            />
          </div>
        </Panel>
      )}

      <Panel
        title="Register"
        subtitle={`${documents.length} document(s)`}
        right={
          loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : null
        }
      >
        {documents.length === 0 && !loading ? (
          <p className="px-6 py-8 text-sm text-gray-500">
            No documents in this range. Tax invoices are issued automatically when a booking completes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Number</th>
                  <th className="px-6 py-2.5 font-medium">Date</th>
                  <th className="px-6 py-2.5 font-medium">Customer</th>
                  <th className="px-6 py-2.5 font-medium">Place</th>
                  <th className="px-6 py-2.5 font-medium text-right">Taxable</th>
                  <th className="px-6 py-2.5 font-medium text-right">Tax</th>
                  <th className="px-6 py-2.5 font-medium text-right">Total</th>
                  <th className="px-6 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc) => (
                  <tr key={doc._id} className={doc.status === "CANCELLED" ? "bg-gray-50/60" : ""}>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        {doc.documentType === "CREDIT_NOTE"
                          ? <Receipt className="w-3.5 h-3.5 text-amber-500" />
                          : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="font-mono text-xs text-gray-900">{doc.invoiceNumber}</span>
                      </div>
                      {doc.status === "CANCELLED" && (
                        <span className="ml-5 text-[10px] uppercase tracking-wide text-gray-400">Cancelled</span>
                      )}
                    </td>
                    <td className="px-6 py-2.5 text-gray-600">{formatDate(doc.date)}</td>
                    <td className="px-6 py-2.5">
                      <p className="text-gray-900">{doc.customer?.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{doc.customer?.gstin || "Unregistered"}</p>
                    </td>
                    <td className="px-6 py-2.5 text-gray-600">
                      {doc.placeOfSupply}
                      <span className="ml-1 text-[10px] text-gray-400">{doc.isInterState ? "IGST" : "CGST+SGST"}</span>
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums text-gray-700">{money(doc.taxableValue)}</td>
                    <td className="px-6 py-2.5 text-right tabular-nums text-gray-700">{money(doc.totalTax)}</td>
                    <td className="px-6 py-2.5 text-right tabular-nums font-semibold text-gray-900">{money(doc.totalAmount)}</td>
                    <td className="px-6 py-2.5 text-right">
                      {doc.documentType === "INVOICE" && doc.status === "ISSUED" && (
                        <button
                          type="button"
                          onClick={() => setCrediting(doc)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Credit note
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {crediting && (
        <CreditNoteDialog
          invoice={crediting}
          onClose={() => setCrediting(null)}
          onDone={() => {
            setCrediting(null);
            notify("success", "Credit note issued");
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminGstDocuments;
