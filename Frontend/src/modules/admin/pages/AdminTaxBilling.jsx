import React, { useState } from "react";
import { Search, Filter, Eye, Download, FileText, Save, Plus } from "lucide-react";

const initialInvoices = [
  { id: "INV-2025-001", bookingId: "BK1025", customer: "Rahul Sharma", subtotal: "₹1,000", discount: "₹100", gst: "₹162", fees: "₹118", total: "₹1,280", date: "22 May 2025", status: "Paid" },
  { id: "INV-2025-002", bookingId: "BK1024", customer: "Priya Verma", subtotal: "₹800", discount: "₹0", gst: "₹144", fees: "₹36", total: "₹980", date: "21 May 2025", status: "Pending" },
  { id: "INV-2025-003", bookingId: "BK1023", customer: "Amit Patel", subtotal: "₹950", discount: "₹50", gst: "₹162", fees: "₹88", total: "₹1,150", date: "20 May 2025", status: "Paid" },
  { id: "INV-2025-004", bookingId: "BK1022", customer: "Neha Singh", subtotal: "₹650", discount: "₹0", gst: "₹117", fees: "₹0", total: "₹767", date: "19 May 2025", status: "Failed" },
  { id: "INV-2025-005", bookingId: "BK1021", customer: "Rohan Gupta", subtotal: "₹1,050", discount: "₹150", gst: "₹162", fees: "₹158", total: "₹1,220", date: "18 May 2025", status: "Paid" },
];

export default function AdminTaxBilling() {
  const [invoices, setInvoices] = useState(initialInvoices);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid": return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Paid</span>;
      case "Pending": return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>;
      case "Failed": return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">Failed</span>;
      default: return null;
    }
  };

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
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Fee Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                <div className="relative">
                  <input type="number" defaultValue="18" className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Applied to base rental amount.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" defaultValue="20" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Fixed fee per booking.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                <div className="relative">
                  <input type="number" defaultValue="5" className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" defaultValue="100" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <div className="flex gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search invoice..." 
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                    <th className="py-3 px-4 font-medium">Invoice ID</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium text-right">Subtotal</th>
                    <th className="py-3 px-4 font-medium text-right">Tax & Fee</th>
                    <th className="py-3 px-4 font-medium text-right">Total</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{inv.id}</div>
                        <div className="text-xs text-gray-500">Ref: {inv.bookingId}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{inv.customer}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{inv.subtotal}</td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">
                        <div>GST: {inv.gst}</div>
                        <div>Fee: {inv.fees}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">{inv.total}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{inv.date}</td>
                      <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Invoice">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
