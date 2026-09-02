import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, Battery, MapPin, User, Calendar, Plus, Image as ImageIcon, Check, AlertTriangle, Wrench } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export default function AdminInspectionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mocking data based on the screenshot
  const bookingId = id || 'BK1025';

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto bg-gray-50/30 p-4 rounded-xl">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/inspections')} className="p-2 hover:bg-gray-100 rounded-md text-gray-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="12" x2="9" y2="6"></line><line x1="3" y1="12" x2="9" y2="18"></line></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EV Inspection Details</h1>
            <p className="text-sm text-gray-500">EV Inspections &gt; Inspection Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/admin/inspections')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Inspections
          </Button>
          <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm">
            <Edit size={16} className="mr-2" /> Edit Inspection
          </Button>
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap md:flex-nowrap items-center gap-8">
        <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl">
          {/* Mock Scooter Image placeholder */}
          <span className="text-4xl">🛵</span>
        </div>
        
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Booking ID</span>
            <span className="text-base font-bold text-blue-600">{bookingId}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Scooty</span>
            <span className="text-sm font-bold text-gray-900 block">Ola S1 Pro</span>
            <span className="text-xs text-gray-500">MP09AB1234</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">User</span>
            <span className="text-sm font-bold text-gray-900 block">Rahul Sharma</span>
            <span className="text-xs text-gray-500">9876543210</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Pickup Date & Time</span>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">20 May 2025</span>
                <span className="text-xs text-gray-500">10:00 AM</span>
              </div>
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Expected Return</span>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">22 May 2025</span>
                <span className="text-xs text-gray-500">06:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-center lg:border-l lg:border-gray-200 lg:pl-8">
          <span className="block text-xs font-medium text-gray-500 mb-2">Overall Status</span>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-100 text-green-700 font-bold text-sm border border-green-200">
            <CheckCircle size={16} /> Passed
          </div>
        </div>
      </div>

      {/* Side-by-Side Inspections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* PICKUP INSPECTION CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <span className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"></path></svg>
               Pickup Inspection
             </span>
          </div>
          
          <div className="p-6 flex-1 space-y-8">
            {/* Top Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Battery %</span>
                <div className="flex items-center gap-1 text-green-600 font-bold"><Battery size={16}/> 96%</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Odometer Reading</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 1,254 km</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Inspector</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><User size={16} className="text-gray-400"/> Aman Verma</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Date & Time</span>
                <div className="flex items-start gap-1 font-semibold text-gray-900 text-sm">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>20 May 2025<br/><span className="text-gray-500 text-xs">10:05 AM</span></div>
                </div>
              </div>
            </div>

            {/* Damage Section */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Existing Damage</span>
                <p className="text-sm text-gray-800">Minor scratch on left side panel.</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Damage Photos</span>
                <div className="flex gap-2">
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-blue-50 rounded border border-blue-200 border-dashed flex flex-col items-center justify-center text-blue-600 cursor-pointer">
                    <Plus size={16} />
                    <span className="text-[10px] font-semibold">Add More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Helmet Given?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> Yes</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Keys Given?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> Yes</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Accessories Provided</span>
                <ul className="text-sm text-gray-800 space-y-1 list-disc pl-4">
                  <li>Charger</li>
                  <li>User Manual</li>
                  <li>2 Rear View Mirrors</li>
                </ul>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-6 border-t border-gray-100">
              <span className="block text-xs font-medium text-gray-500 mb-2">Notes</span>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">Scooty is working fine. No other major issues found.</p>
            </div>
          </div>
        </div>

        {/* RETURN INSPECTION CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <span className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"></path></svg>
               Return Inspection
             </span>
          </div>
          
          <div className="p-6 flex-1 space-y-8 flex flex-col">
            {/* Top Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Return Battery %</span>
                <div className="flex items-center gap-1 text-orange-500 font-bold"><Battery size={16}/> 28%</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Odometer Reading</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 1,387 km</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Inspector</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><User size={16} className="text-gray-400"/> Neha Singh</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Date & Time</span>
                <div className="flex items-start gap-1 font-semibold text-gray-900 text-sm">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>22 May 2025<br/><span className="text-gray-500 text-xs">06:15 PM</span></div>
                </div>
              </div>
            </div>

            {/* Damage Section */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-xs font-medium text-red-500 mb-2">New Damage Found</span>
                <p className="text-sm text-gray-800">Scratch on front mudguard.</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Damage Photos</span>
                <div className="flex gap-2">
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                  <div className="w-14 h-14 bg-blue-50 rounded border border-blue-200 border-dashed flex flex-col items-center justify-center text-blue-600 cursor-pointer">
                    <Plus size={16} />
                    <span className="text-[10px] font-semibold">Add More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Helmet Returned?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> Yes</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Keys Returned?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> Yes</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Accessories Returned</span>
                <ul className="text-sm text-gray-800 space-y-1 list-disc pl-4">
                  <li>Charger</li>
                  <li>User Manual</li>
                  <li>2 Rear View Mirrors</li>
                </ul>
              </div>
            </div>

            {/* Spacer to push financials to bottom */}
            <div className="flex-1"></div>

            {/* Financials Row */}
            <div className="grid grid-cols-4 gap-3 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Extra Damage Charges</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-red-600">
                  <span className="text-gray-400 text-sm font-normal">₹</span> 300
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Late Fee</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
                  <span className="text-gray-400 text-sm font-normal">₹</span> 0
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Total Deductions</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-red-600">
                  <span className="text-gray-400 text-sm font-normal">₹</span> 300
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-sm">
                <span className="block text-[11px] font-bold text-green-700 mb-1">Final Deposit Refund</span>
                <div className="flex items-center gap-1.5 text-xl font-black text-green-700">
                  <span className="text-green-600/60 text-sm font-bold">₹</span> 700
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Inspection Timeline</h3>
          <div className="relative pl-6 space-y-6">
             {/* Line */}
             <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
             
             {/* Item 1 */}
             <div className="relative z-10">
               <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white"><Check size={12} strokeWidth={3}/></div>
               <div className="font-bold text-sm text-gray-900">Pickup Inspection</div>
               <div className="text-xs text-gray-500 mt-1">20 May 2025, 10:05 AM</div>
               <div className="text-xs text-gray-500">by Aman Verma</div>
             </div>

             {/* Item 2 */}
             <div className="relative z-10">
               <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"></path></svg></div>
               <div className="font-bold text-sm text-gray-900">Scooty Rented</div>
               <div className="text-xs text-gray-500 mt-1">20 May 2025 - 22 May 2025</div>
               <div className="text-xs text-gray-500">Duration: 2 Days</div>
             </div>

             {/* Item 3 */}
             <div className="relative z-10">
               <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white"><Check size={12} strokeWidth={3}/></div>
               <div className="font-bold text-sm text-gray-900">Return Inspection</div>
               <div className="text-xs text-gray-500 mt-1">22 May 2025, 06:15 PM</div>
               <div className="text-xs text-gray-500">by Neha Singh</div>
             </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Inspection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            
            <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-4">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                <CheckCircle size={18} /> Passed
              </div>
              <p className="text-xs text-gray-600">Scooty returned in good condition.</p>
            </div>

            <div className="rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4">
              <div className="flex items-center gap-2 text-orange-600 font-bold mb-2">
                <AlertTriangle size={18} /> Damage Found
              </div>
              <p className="text-xs text-gray-600">Minor damage charges applied.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-50 grayscale cursor-not-allowed">
              <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
                <Wrench size={18} /> Needs Maintenance
              </div>
              <p className="text-xs text-gray-500">Scooty needs maintenance.</p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
