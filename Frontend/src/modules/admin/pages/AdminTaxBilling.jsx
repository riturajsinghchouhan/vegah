import React, { useState, useEffect } from "react";
import { Search, Eye, Download, Save, Loader2, X, Printer, FileText, Plus, Trash2, RotateCcw } from "lucide-react";
import { adminService } from "../services/adminService";

const EMPTY_INVOICE_FORM = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  bookingId: "",
  vehicleName: "",
  description: "",
  baseAmount: "",
  serviceFee: "",
  platformFee: "",
  gstRate: "",
  paymentMethod: "CASH",
  status: "Paid",
  date: "",
  notes: "",
};

const PAYMENT_MODES = ["CASH", "ONLINE", "UPI", "CARD", "BANK_TRANSFER", "WALLET", "OTHER"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default function AdminTaxBilling() {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_INVOICE_FORM);

  const [showBin, setShowBin] = useState(false);
  const [binInvoices, setBinInvoices] = useState([]);
  const [binLoading, setBinLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [settings, setSettings] = useState({
    gstRate: "18",
    platformFee: "20",
    serviceCharge: "5",
    cancellationFee: "100",
    batteryPackageUnlimited: "150",
    batteryPackageSingle: "50",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, settingsRes] = await Promise.all([
        adminService.getTaxBilling(),
        adminService.getSettings({ category: "pricing" }),
      ]);
      setTaxData(taxRes);
      if (settingsRes && Object.keys(settingsRes).length > 0) {
        setSettings((prev) => ({ ...prev, ...settingsRes }));
      }
    } catch (err) {
      console.error("Error fetching tax/billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBin = async () => {
    try {
      setBinLoading(true);
      setBinInvoices(await adminService.getDeletedInvoices());
    } catch (err) {
      console.error("Error fetching deleted invoices:", err);
    } finally {
      setBinLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBin();
  }, []);

  const handleDeleteInvoice = async (inv) => {
    if (!window.confirm(`Move invoice ${inv.invoiceId} to the bin? The booking and payment are not affected.`)) return;
    try {
      setBusyId(inv.id);
      await adminService.deleteInvoice(inv.id);
      if (selectedInvoice?.id === inv.id) setSelectedInvoice(null);
      await Promise.all([fetchData(), fetchBin()]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete invoice");
    } finally {
      setBusyId(null);
    }
  };

  const handleRestoreInvoice = async (inv) => {
    try {
      setBusyId(inv.id);
      await adminService.restoreInvoice(inv.id);
      await Promise.all([fetchData(), fetchBin()]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore invoice");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeInvoice = async (inv) => {
    if (!window.confirm(`Permanently delete invoice ${inv.invoiceId}? This cannot be undone.`)) return;
    try {
      setBusyId(inv.id);
      await adminService.purgeInvoice(inv.id);
      await fetchBin();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to permanently delete invoice");
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setCreateForm({
      ...EMPTY_INVOICE_FORM,
      gstRate: String(settings.gstRate ?? 18),
      date: new Date().toLocaleDateString("en-CA"),
    });
    setShowCreate(true);
  };

  const setField = (field) => (e) => setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toNum = (v) => Number(v) || 0;
  const previewTaxable = toNum(createForm.baseAmount) + toNum(createForm.serviceFee) + toNum(createForm.platformFee);
  const previewTax = Math.round(previewTaxable * toNum(createForm.gstRate)) / 100;
  const previewTotal = Math.round((previewTaxable + previewTax) * 100) / 100;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!createForm.customerName.trim()) return alert("Customer name is required");
    if (toNum(createForm.baseAmount) <= 0) return alert("Base amount must be greater than 0");
    try {
      setCreating(true);
      const created = await adminService.createInvoice(createForm);
      setShowCreate(false);
      await fetchData();
      setSelectedInvoice(created);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateSettings(settings, "pricing");
      alert("Tax & fee settings saved successfully! User booking calculations are now updated.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const invoices = taxData?.invoices || [];
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceId?.toLowerCase().includes(term) ||
      inv.bookingId?.toLowerCase().includes(term) ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.customerPhone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tax & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Tax & Billing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBin(true); fetchBin(); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Bin
            {binInvoices.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                {binInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tax Settings Form */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Fee Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.gstRate}
                    onChange={(e) => setSettings({ ...settings, gstRate: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Applied to base rental and platform charges.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.platformFee}
                    onChange={(e) => setSettings({ ...settings, platformFee: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Fixed fee per booking displayed to the user.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.serviceCharge}
                    onChange={(e) => setSettings({ ...settings, serviceCharge: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Service fee percentage applied on base fare.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.cancellationFee}
                    onChange={(e) => setSettings({ ...settings, cancellationFee: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Battery Package – Unlimited (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.batteryPackageUnlimited}
                    onChange={(e) => setSettings({ ...settings, batteryPackageUnlimited: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Charged per booking for unlimited battery swaps.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Battery Package – Single Charge (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.batteryPackageSingle}
                    onChange={(e) => setSettings({ ...settings, batteryPackageSingle: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Charged per booking for a single battery charge.</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings & Update Users
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Invoice Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total {invoices.length} invoices from rentals & payments, plus ones created by admin
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice or booking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading invoices...
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-gray-800 text-xs text-white uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Invoice ID</th>
                      <th className="py-3 px-4 font-semibold">Customer / Booking</th>
                      <th className="py-3 px-4 font-semibold text-right">Base Fare</th>
                      <th className="py-3 px-4 font-semibold text-right">GST ({settings.gstRate || 18}%)</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-gray-500">
                          {searchTerm ? "No matching invoices found" : "No invoices generated yet"}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv, idx) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-gray-900">
                            <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {inv.invoiceId}
                            </span>
                            {inv.source === "MANUAL" && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Manual
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-900 text-sm">{inv.customerName}</div>
                            {inv.bookingId && (
                              <div className="text-xs text-blue-600 font-mono">{inv.bookingId}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-600 font-mono">₹{inv.baseAmount}</td>
                          <td className="py-3.5 px-4 text-right text-gray-500 font-mono">₹{inv.taxAmount}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">₹{inv.totalAmount}</td>
                          <td className="py-3.5 px-4 text-gray-500 text-xs">
                            {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                              inv.status === "Unpaid"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {inv.status || "Paid"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                title="View and Print Invoice"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(inv)}
                                disabled={busyId === inv.id}
                                title="Move to Bin"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {busyId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>


      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Create Invoice
              </span>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-rose-500">*</span></label>
                <input value={createForm.customerName} onChange={setField("customerName")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={createForm.customerPhone} onChange={setField("customerPhone")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={createForm.customerEmail} onChange={setField("customerEmail")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID (optional)</label>
                <input value={createForm.bookingId} onChange={setField("bookingId")} placeholder="EVR-12345" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <input value={createForm.vehicleName} onChange={setField("vehicleName")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input type="date" value={createForm.date} onChange={setField("date")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={createForm.description} onChange={setField("description")} placeholder="Vehicle Base Rental" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (₹) <span className="text-rose-500">*</span></label>
                <input type="number" min="0" step="0.01" value={createForm.baseAmount} onChange={setField("baseAmount")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={createForm.gstRate} onChange={setField("gstRate")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (₹)</label>
                <input type="number" min="0" step="0.01" value={createForm.serviceFee} onChange={setField("serviceFee")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (₹)</label>
                <input type="number" min="0" step="0.01" value={createForm.platformFee} onChange={setField("platformFee")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={createForm.paymentMethod} onChange={setField("paymentMethod")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={createForm.status} onChange={setField("status")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={createForm.notes} onChange={setField("notes")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div className="sm:col-span-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="text-gray-600">Taxable: <span className="font-mono">₹{previewTaxable.toFixed(2)}</span></span>
                <span className="text-gray-600">GST: <span className="font-mono">₹{previewTax.toFixed(2)}</span></span>
                <span className="font-bold text-gray-900">Total: <span className="font-mono text-blue-600">₹{previewTotal.toFixed(2)}</span></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bin Modal */}
      {showBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-red-600" /> Bin — Deleted Invoices
                </span>
                <p className="text-xs text-gray-500 mt-0.5">Restore an invoice to bring it back, or delete it forever.</p>
              </div>
              <button
                onClick={() => setShowBin(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {binLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading bin...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-800 text-xs text-white uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Invoice ID</th>
                      <th className="py-3 px-4 font-semibold">Customer / Booking</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                      <th className="py-3 px-4 font-semibold">Deleted On</th>
                      <th className="py-3 px-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {binInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-gray-500">Bin is empty</td>
                      </tr>
                    ) : (
                      binInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{inv.invoiceId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 text-sm">{inv.customerName}</div>
                            {inv.bookingId && <div className="text-xs text-blue-600 font-mono">{inv.bookingId}</div>}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">₹{inv.totalAmount}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(inv.deletedAt)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => handleRestoreInvoice(inv)}
                                disabled={busyId === inv.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Restore
                              </button>
                              <button
                                onClick={() => handlePurgeInvoice(inv)}
                                disabled={busyId === inv.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Viewer / Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="p-8 space-y-6" id="printable-invoice">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-6 border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">VEGAH MOBILITY</h2>
                  <p className="text-xs text-gray-500 mt-1">Smart Electric Vehicle Rentals</p>
                  <p className="text-xs text-gray-400">GSTIN: 29AABCU9603R1Z7</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md tracking-wider uppercase">
                    Tax Invoice
                  </span>
                  <p className="text-xs font-mono font-semibold text-gray-800 mt-2">{selectedInvoice.invoiceId}</p>
                  <p className="text-xs text-gray-500">
                    Date: {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 uppercase font-semibold">Billed To</p>
                  <p className="font-semibold text-gray-900 mt-1 text-sm">{selectedInvoice.customerName}</p>
                  {selectedInvoice.customerPhone && <p className="text-gray-600">{selectedInvoice.customerPhone}</p>}
                  {selectedInvoice.customerEmail && <p className="text-gray-600">{selectedInvoice.customerEmail}</p>}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 uppercase font-semibold">Rental Details</p>
                  <p className="font-medium text-gray-900 mt-1">Booking: {selectedInvoice.bookingId || "N/A"}</p>
                  <p className="text-gray-600">Vehicle: {selectedInvoice.vehicleName || "Electric Vehicle"}</p>
                  <p className="text-gray-600">Payment: {selectedInvoice.paymentMethod || "ONLINE"}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2 px-3 text-gray-800">{selectedInvoice.description || "Vehicle Base Rental"}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-800">₹{selectedInvoice.baseAmount}</td>
                    </tr>
                    {selectedInvoice.serviceFee > 0 && (
                      <tr>
                        <td className="py-2 px-3 text-gray-800">{selectedInvoice.source === "MANUAL" ? "Service Fee" : `Service Fee (${settings.serviceCharge || 5}%)`}</td>
                        <td className="py-2 px-3 text-right font-mono text-gray-800">₹{selectedInvoice.serviceFee}</td>
                      </tr>
                    )}
                    {selectedInvoice.platformFee > 0 && (
                      <tr>
                        <td className="py-2 px-3 text-gray-800">Platform Convenience Fee</td>
                        <td className="py-2 px-3 text-right font-mono text-gray-800">₹{selectedInvoice.platformFee}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 px-3 text-gray-800">GST ({selectedInvoice.gstRate || `${settings.gstRate}%`})</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-800">₹{selectedInvoice.taxAmount}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr className="font-bold text-gray-900 text-sm">
                      <td className="py-3 px-3">{selectedInvoice.status === "Unpaid" ? "Total Due" : "Total Paid"}</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600">₹{selectedInvoice.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedInvoice.notes && (
                <p className="text-xs text-gray-600"><span className="font-semibold">Notes:</span> {selectedInvoice.notes}</p>
              )}

              {/* Footer */}
              <div className="text-[11px] text-gray-400 text-center border-t border-gray-100 pt-4">
                Thank you for choosing Vegah EV Mobility. This is a computer-generated tax invoice.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
