import React, { useState, useEffect } from "react";
import { Search, Eye, Download, Save, Loader2 } from "lucide-react";
import { adminService } from "../services/adminService";

export default function AdminTaxBilling() {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    gstRate: "18",
    platformFee: "20",
    serviceCharge: "5",
    cancellationFee: "100",
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      alert("Tax & fee settings saved successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const invoices = taxData?.invoices || [];

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tax & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard &gt; Tax & Billing</p>
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
                <p className="text-xs text-gray-500 mt-1">Applied to base rental amount.</p>
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
                <p className="text-xs text-gray-500 mt-1">Fixed fee per booking.</p>
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

              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Invoice Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">System Generated Invoices</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading invoices...
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-800 text-sm text-white">
                      <th className="py-3 px-4 font-medium">Invoice ID</th>
                      <th className="py-3 px-4 font-medium text-right">Base Amount</th>
                      <th className="py-3 px-4 font-medium text-right">GST (18%)</th>
                      <th className="py-3 px-4 font-medium text-right">Total</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">No invoices generated yet</td>
                      </tr>
                    ) : (
                      invoices.map((inv, idx) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceId}</td>
                          <td className="py-3 px-4 text-right text-gray-600">₹{inv.baseAmount}</td>
                          <td className="py-3 px-4 text-right text-gray-500">₹{inv.taxAmount}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">₹{inv.totalAmount}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 font-medium border border-green-200">
                              {inv.status}
                            </span>
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
    </div>
  );
}
