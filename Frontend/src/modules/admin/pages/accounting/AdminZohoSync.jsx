import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plug,
  RefreshCw,
  Save,
  Settings2,
  Users,
  XCircle,
} from "lucide-react";
import { adminService } from "../../services/adminService";

/**
 * The control surface for the Zoho Books mirror.
 *
 * Three jobs: prove the credentials work, let an admin map Zoho's account and
 * tax ids onto ours, and show what has and has not reached Zoho. Nothing here
 * posts to the GST portal; it only feeds the books the CA files from.
 */

const TABS = [
  { id: "connection", label: "Connection", icon: Plug },
  { id: "mapping", label: "Mapping", icon: Settings2 },
  { id: "records", label: "Sync Records", icon: RefreshCw },
];

const GST_RATES = ["5", "12", "18", "28"];

// Zoho keeps a CGST+SGST group and a plain IGST tax for every rate, and which
// one an invoice uses is decided by the place of supply, not by the admin. Both
// have to be mapped or half the bookings file under the wrong head.
const TAX_DIRECTIONS = [
  {
    key: "intra",
    title: "GST tax ids · intra-state (CGST+SGST)",
    hint: "Used when the place of supply is your own state. Pick the grouped GST tax for each rate.",
  },
  {
    key: "inter",
    title: "GST tax ids · inter-state (IGST)",
    hint: "Used when the place of supply is any other state. Pick the IGST tax for each rate.",
  },
];

const EXPENSE_CATEGORIES = [
  "CHARGING", "MAINTENANCE", "REPAIR", "SALARY", "RENT", "UTILITIES",
  "INSURANCE", "MARKETING", "TRANSPORT", "OFFICE", "OTHER",
];

const PUSH_TARGETS = [
  { kind: "customers", label: "Riders", entity: "CONTACT" },
  { kind: "invoices", label: "Invoices", entity: "INVOICE" },
  { kind: "payments", label: "Payments", entity: "PAYMENT" },
  { kind: "expenses", label: "Expenses", entity: "EXPENSE" },
];

const SAC_FIELDS = [
  { key: "rental", label: "Rental" },
  { key: "swap", label: "Battery swap" },
  { key: "serviceFee", label: "Service fee" },
  { key: "platformFee", label: "Platform fee" },
  { key: "lateFee", label: "Late fee" },
  { key: "damage", label: "Damage recovery" },
  { key: "cancellationFee", label: "Cancellation fee" },
];

const STATUS_STYLES = {
  SYNCED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  SKIPPED: "bg-gray-50 text-gray-600 border-gray-200",
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

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

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
  </label>
);

const selectClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";

const StatusPill = ({ status }) => (
  <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status] || STATUS_STYLES.SKIPPED}`}>
    {status}
  </span>
);

const AdminZohoSync = () => {
  const [tab, setTab] = useState("connection");
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [states, setStates] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordFilter, setRecordFilter] = useState({ entity: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const notify = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadStatus = useCallback(async () => {
    const data = await adminService.getZohoStatus();
    setStatus(data);
    return data;
  }, []);

  const loadConfig = useCallback(async () => {
    const data = await adminService.getZohoConfig();
    setConfig(data.config);
    setStates(data.states || []);
  }, []);

  const loadRecords = useCallback(async () => {
    const params = {};
    if (recordFilter.entity) params.entity = recordFilter.entity;
    if (recordFilter.status) params.status = recordFilter.status;
    const data = await adminService.getZohoSyncRecords(params);
    setRecords(data.data || []);
  }, [recordFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadStatus(), loadConfig()]);
      } catch (error) {
        notify("error", error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadStatus, loadConfig]);

  useEffect(() => {
    if (tab !== "records") return;
    loadRecords().catch((error) => notify("error", error.message));
  }, [tab, loadRecords]);

  // Lookups cost live Zoho calls, so they are fetched when the mapping tab is
  // first opened rather than on page load.
  const fetchLookups = async () => {
    setBusy("lookups");
    try {
      setLookups(await adminService.getZohoLookups());
      notify("success", "Accounts and taxes loaded from Zoho");
    } catch (error) {
      notify("error", error?.response?.data?.message || error.message);
    } finally {
      setBusy(null);
    }
  };

  // Walks to any depth because the tax ids are nested a level deeper than the
  // other groups: taxes.intra.18 and taxes.inter.18 are different Zoho taxes.
  const patch = (path, value) => {
    setConfig((prev) => {
      const next = { ...prev };
      let cursor = next;
      for (const key of path.slice(0, -1)) {
        cursor[key] = { ...cursor[key] };
        cursor = cursor[key];
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setBusy("save");
    try {
      const data = await adminService.saveZohoConfig(config);
      setConfig(data.config);
      await loadStatus();
      notify("success", "Mapping saved");
    } catch (error) {
      notify("error", error?.response?.data?.message || error.message);
    } finally {
      setBusy(null);
    }
  };

  const runPush = async (kind) => {
    setBusy(kind);
    try {
      const result = await adminService.pushZohoPending(kind, 200);
      await Promise.all([loadStatus(), tab === "records" ? loadRecords() : Promise.resolve()]);

      // "all" returns one result per target, so the counts are summed for the
      // single line of feedback.
      const runs = kind === "all" ? Object.values(result) : [result[kind] || result];
      const totals = runs.reduce(
        (acc, run) => ({
          attempted: acc.attempted + (run?.attempted || 0),
          synced: acc.synced + (run?.synced || 0),
          failed: acc.failed + (run?.failed || 0),
        }),
        { attempted: 0, synced: 0, failed: 0 }
      );

      notify(
        totals.failed ? "error" : "success",
        totals.attempted === 0
          ? "Nothing pending"
          : `${totals.synced} of ${totals.attempted} pushed${totals.failed ? `, ${totals.failed} failed` : ""}`
      );
    } catch (error) {
      notify("error", error?.response?.data?.message || error.message);
    } finally {
      setBusy(null);
    }
  };

  const retryRecord = async (id) => {
    setBusy(`retry:${id}`);
    try {
      await adminService.retryZohoRecord(id);
      await Promise.all([loadRecords(), loadStatus()]);
      notify("success", "Record pushed");
    } catch (error) {
      notify("error", error?.response?.data?.message || error.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Zoho status…
      </div>
    );
  }

  const counts = status?.counts || {};
  const contactCounts = counts.CONTACT || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Zoho Books</h1>
        <p className="text-sm text-gray-500 mt-1">
          GST-compliant mirror of the ledger. Invoices, payments and expenses are pushed here for filing.
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
          {message.type === "error" ? <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "connection" && (
        <div className="space-y-4">
          <Panel
            title="Connection"
            subtitle="Credentials come from the backend .env, not this screen."
            right={
              <button
                type="button"
                onClick={() => loadStatus().catch((e) => notify("error", e.message))}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recheck
              </button>
            }
          >
            <div className="px-6 py-5 space-y-4">
              {!status?.configured && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Not configured</p>
                    <p className="text-xs mt-1">
                      Set ZOHO_ENABLED, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN and
                      ZOHO_ORGANIZATION_ID in the backend .env, then restart the server.
                    </p>
                  </div>
                </div>
              )}

              {status?.configured && status?.connectionError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Connection failed</p>
                    <p className="text-xs mt-1 font-mono">{status.connectionError}</p>
                  </div>
                </div>
              )}

              {status?.organization && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    ["Organisation", status.organization.name],
                    ["Org ID", status.organization.organizationId],
                    ["Currency", status.organization.currency],
                    ["Time zone", status.organization.timeZone],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}

              {Boolean(status?.missing?.invoice?.length || status?.missing?.payment?.length) && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  <p className="font-medium">Mapping incomplete</p>
                  <ul className="text-xs mt-1 list-disc list-inside space-y-0.5">
                    {[...new Set([...(status.missing.invoice || []), ...(status.missing.payment || [])])].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Push"
            subtitle="Invoices are pushed automatically when a booking completes. This catches up anything missed."
            right={
              <button
                type="button"
                onClick={() => runPush("all")}
                disabled={!status?.connected || Boolean(busy)}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Push everything
              </button>
            }
          >
            <div className="divide-y divide-gray-50">
              {PUSH_TARGETS.map(({ kind, label, entity }) => {
                const c = counts[entity] || {};
                return (
                  <div key={kind} className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5">
                    <div className="flex items-center gap-6">
                      <span className="w-24 text-sm font-medium text-gray-900">{label}</span>
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-green-700 tabular-nums">{c.SYNCED || 0}</span> synced
                        {" · "}
                        <span className="font-semibold text-red-600 tabular-nums">{c.FAILED || 0}</span> failed
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => runPush(kind)}
                      disabled={!status?.connected || Boolean(busy)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      {busy === kind ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Push pending
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {tab === "mapping" && config && (
        <div className="space-y-4">
          <Panel
            title="Zoho ids"
            subtitle="These are generated per organisation, so they must be picked from the connected org."
            right={
              <button
                type="button"
                onClick={fetchLookups}
                disabled={!status?.connected || busy === "lookups"}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {busy === "lookups" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Load from Zoho
              </button>
            }
          >
            <div className="px-6 py-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Supplier state"
                  hint="Decides CGST+SGST versus IGST on every invoice."
                >
                  <select
                    value={config.supplierStateCode || ""}
                    onChange={(e) => patch(["supplierStateCode"], e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select state…</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Invoice numbering">
                  <select
                    value={config.useOwnInvoiceNumbers ? "own" : "zoho"}
                    onChange={(e) => patch(["useOwnInvoiceNumbers"], e.target.value === "own")}
                    className={selectClass}
                  >
                    <option value="own">Use our invoice numbers</option>
                    <option value="zoho">Let Zoho generate numbers</option>
                  </select>
                </Field>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Deposit accounts</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {[["bank", "Bank"], ["cash", "Cash in hand"], ["wallet", "Wallet / other"]].map(([key, label]) => (
                    <Field key={key} label={label}>
                      <select
                        value={config.accounts?.[key] || ""}
                        onChange={(e) => patch(["accounts", key], e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Not mapped</option>
                        {(lookups?.depositAccounts || []).map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                        {/* Keeps a saved id visible before lookups are loaded. */}
                        {config.accounts?.[key]
                          && !(lookups?.depositAccounts || []).some((a) => a.id === config.accounts[key]) && (
                          <option value={config.accounts[key]}>{config.accounts[key]}</option>
                        )}
                      </select>
                    </Field>
                  ))}
                </div>
              </div>

              {TAX_DIRECTIONS.map(({ key, title, hint }) => (
                <div key={key}>
                  <p className="text-xs font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mb-2">{hint}</p>
                  <div className="grid gap-4 md:grid-cols-4">
                    {GST_RATES.map((rate) => (
                      <Field key={rate} label={`${rate}%`}>
                        <select
                          value={config.taxes?.[key]?.[rate] || ""}
                          onChange={(e) => patch(["taxes", key, rate], e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Not mapped</option>
                          {/* Only the taxes Zoho marks for this direction, so an
                              IGST tax cannot be mapped to an intra-state slot.
                              Taxes with no direction (non-India orgs) stay listed. */}
                          {(lookups?.taxes || [])
                            .filter((t) => !t.direction || t.direction === key)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.percentage}%){t.isGroup ? " · group" : ""}
                              </option>
                            ))}
                          {config.taxes?.[key]?.[rate]
                            && !(lookups?.taxes || []).some((t) => t.id === config.taxes[key][rate]) && (
                            <option value={config.taxes[key][rate]}>{config.taxes[key][rate]}</option>
                          )}
                        </select>
                      </Field>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Expense accounts</p>
                <div className="grid gap-4 md:grid-cols-4">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <Field key={category} label={category === "OTHER" ? "OTHER (default)" : category}>
                      <select
                        value={config.expenseAccounts?.[category] || ""}
                        onChange={(e) => patch(["expenseAccounts", category], e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Use default</option>
                        {(lookups?.expenseAccounts || []).map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                        {config.expenseAccounts?.[category]
                          && !(lookups?.expenseAccounts || []).some((a) => a.id === config.expenseAccounts[category]) && (
                          <option value={config.expenseAccounts[category]}>{config.expenseAccounts[category]}</option>
                        )}
                      </select>
                    </Field>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">SAC codes</p>
                <div className="grid gap-4 md:grid-cols-4">
                  {SAC_FIELDS.map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <input
                        value={config.sac?.[key] || ""}
                        onChange={(e) => patch(["sac", key], e.target.value)}
                        className={selectClass}
                        placeholder="997311"
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy === "save"}
                  className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save mapping
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === "records" && (
        <Panel
          title="Sync records"
          subtitle="One row per local record that belongs in Zoho."
          right={
            <div className="flex gap-2">
              <select
                value={recordFilter.entity}
                onChange={(e) => setRecordFilter((f) => ({ ...f, entity: e.target.value }))}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700"
              >
                <option value="">All entities</option>
                {["CONTACT", "INVOICE", "PAYMENT", "DEPOSIT", "DEPOSIT_REFUND", "EXPENSE", "VENDOR"].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <select
                value={recordFilter.status}
                onChange={(e) => setRecordFilter((f) => ({ ...f, status: e.target.value }))}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700"
              >
                <option value="">All statuses</option>
                {["PENDING", "SYNCED", "FAILED", "SKIPPED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          }
        >
          {records.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">Nothing synced yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-2.5 font-medium">Entity</th>
                    <th className="px-6 py-2.5 font-medium">Local id</th>
                    <th className="px-6 py-2.5 font-medium">Zoho</th>
                    <th className="px-6 py-2.5 font-medium">Status</th>
                    <th className="px-6 py-2.5 font-medium">Last attempt</th>
                    <th className="px-6 py-2.5 font-medium">Error</th>
                    <th className="px-6 py-2.5 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((row) => (
                    <tr key={row._id}>
                      <td className="px-6 py-2.5 text-gray-700">{row.entity}</td>
                      <td className="px-6 py-2.5 font-mono text-xs text-gray-500">{row.localId}</td>
                      <td className="px-6 py-2.5 text-gray-700">{row.zohoNumber || row.zohoId || "—"}</td>
                      <td className="px-6 py-2.5"><StatusPill status={row.status} /></td>
                      <td className="px-6 py-2.5 text-gray-500">{formatDate(row.lastAttemptAt)}</td>
                      <td className="px-6 py-2.5 text-xs text-red-600 max-w-xs truncate" title={row.lastError || ""}>
                        {row.lastError || "—"}
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        {row.status === "FAILED" && (
                          <button
                            type="button"
                            onClick={() => retryRecord(row._id)}
                            disabled={busy === `retry:${row._id}`}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                          >
                            {busy === `retry:${row._id}` ? "…" : "Retry"}
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
      )}
    </div>
  );
};

export default AdminZohoSync;
