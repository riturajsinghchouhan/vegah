import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, Battery, MapPin, User, Calendar, Plus, Image as ImageIcon, Check, AlertTriangle, Wrench } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { adminService } from '../services/adminService';

export default function AdminInspectionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getInspectionById(id);
      setDetails(data);
    } catch (error) {
      console.error("Failed to load inspection details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500 font-medium bg-white rounded-xl border border-gray-200 max-w-4xl mx-auto my-8">
        Loading inspection details...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-16 text-center text-gray-500 font-medium bg-white rounded-xl border border-gray-200 max-w-4xl mx-auto my-8 space-y-4">
        <p>Inspection details not found for ID: {id}</p>
        <Button onClick={() => navigate('/admin/inspections')}>Back to Inspections</Button>
      </div>
    );
  }

  const { scooty, user, pickupInspection, returnInspection } = details;

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto bg-gray-50/30 p-4 rounded-xl">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/inspections')} className="p-2 hover:bg-gray-100 rounded-md text-gray-500">
            <ArrowLeft size={20} />
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
        <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100 p-2">
          <img 
            src={scooty.image} 
            alt={scooty.name} 
            className="w-full h-full object-contain"
            onError={(e) => { e.target.src = '/assets/category/dfafa.png'; }}
          />
        </div>
        
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Booking ID</span>
            <span className="text-base font-bold text-blue-600">{details.bookingId}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Scooty</span>
            <span className="text-sm font-bold text-gray-900 block">{scooty.name}</span>
            <span className="text-xs text-gray-500">{scooty.plateNumber}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">User</span>
            <span className="text-sm font-bold text-gray-900 block">{user.name}</span>
            <span className="text-xs text-gray-500">{user.phone}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Pickup Date & Time</span>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">{details.pickupDate}</span>
                <span className="text-xs text-gray-500">{details.pickupTime}</span>
              </div>
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 mb-1">Expected Return</span>
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">{details.expectedReturnDate}</span>
                <span className="text-xs text-gray-500">{details.expectedReturnTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-center lg:border-l lg:border-gray-200 lg:pl-8">
          <span className="block text-xs font-medium text-gray-500 mb-2">Overall Status</span>
          {details.overallStatus === 'Passed' && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-100 text-green-700 font-bold text-sm border border-green-200">
              <CheckCircle size={16} /> Passed
            </div>
          )}
          {details.overallStatus === 'Damage Found' && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm border border-orange-200">
              <AlertTriangle size={16} /> Damage Found
            </div>
          )}
          {details.overallStatus === 'Needs Maintenance' && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm border border-gray-200">
              <Wrench size={16} /> Needs Maintenance
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Inspections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* PICKUP INSPECTION CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <span className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
               Pickup Inspection
             </span>
          </div>
          
          <div className="p-6 flex-1 space-y-8">
            {/* Top Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Battery %</span>
                <div className="flex items-center gap-1 text-green-600 font-bold"><Battery size={16}/> {pickupInspection.batteryPercent}%</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Odometer Reading</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900">{pickupInspection.odometer}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Inspector</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><User size={16} className="text-gray-400"/> {pickupInspection.inspector}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Date & Time</span>
                <div className="flex items-start gap-1 font-semibold text-gray-900 text-sm">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>{pickupInspection.date}<br/><span className="text-gray-500 text-xs">{pickupInspection.time}</span></div>
                </div>
              </div>
            </div>

            {/* Damage Section */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Existing Damage</span>
                <p className="text-sm text-gray-800">{pickupInspection.existingDamage}</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Damage Photos</span>
                <div className="flex gap-2">
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
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> {pickupInspection.helmetGiven ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Keys Given?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> {pickupInspection.keysGiven ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Accessories Provided</span>
                <ul className="text-sm text-gray-800 space-y-1 list-disc pl-4">
                  {pickupInspection.accessories.map((acc, idx) => (
                    <li key={idx}>{acc}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-6 border-t border-gray-100">
              <span className="block text-xs font-medium text-gray-500 mb-2">Notes</span>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{pickupInspection.notes}</p>
            </div>
          </div>
        </div>

        {/* RETURN INSPECTION CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <span className="text-blue-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
               Return Inspection
             </span>
          </div>
          
          <div className="p-6 flex-1 space-y-8 flex flex-col">
            {/* Top Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Return Battery %</span>
                <div className="flex items-center gap-1 text-orange-500 font-bold"><Battery size={16}/> {returnInspection.batteryPercent}%</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Odometer Reading</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900">{returnInspection.odometer}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Inspector</span>
                <div className="flex items-center gap-1 font-semibold text-gray-900"><User size={16} className="text-gray-400"/> {returnInspection.inspector}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Date & Time</span>
                <div className="flex items-start gap-1 font-semibold text-gray-900 text-sm">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>{returnInspection.date}<br/><span className="text-gray-500 text-xs">{returnInspection.time}</span></div>
                </div>
              </div>
            </div>

            {/* Damage Section */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-xs font-medium text-red-500 mb-2">New Damage Found</span>
                <p className="text-sm text-gray-800">{returnInspection.damageFound}</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Damage Photos</span>
                <div className="flex gap-2">
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
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> {returnInspection.helmetReturned ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Keys Returned?</span>
                <div className="flex items-center gap-1.5 text-green-600 font-bold"><div className="bg-green-100 p-0.5 rounded-full"><Check size={14} strokeWidth={3}/></div> {returnInspection.keysReturned ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-2">Accessories Returned</span>
                <ul className="text-sm text-gray-800 space-y-1 list-disc pl-4">
                  {returnInspection.accessories.map((acc, idx) => (
                    <li key={idx}>{acc}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Financials Row */}
            <div className="grid grid-cols-4 gap-3 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Extra Damage Charges</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-red-600">
                  <span className="text-gray-400 text-sm font-normal">₹</span> {returnInspection.damageCharges}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Late Fee</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
                  <span className="text-gray-400 text-sm font-normal">₹</span> {returnInspection.lateFee}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">Total Deductions</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-red-600">
                  <span className="text-gray-400 text-sm font-normal">₹</span> {returnInspection.totalDeductions}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-sm">
                <span className="block text-[11px] font-bold text-green-700 mb-1">Final Deposit Refund</span>
                <div className="flex items-center gap-1.5 text-xl font-black text-green-700">
                  <span className="text-green-600/60 text-sm font-bold">₹</span> {returnInspection.depositRefund}
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
             <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
             
             {details.timeline.map((item, idx) => (
               <div key={idx} className="relative z-10">
                 <div className="absolute -left-[27px] w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white">
                   <Check size={12} strokeWidth={3}/>
                 </div>
                 <div className="font-bold text-sm text-gray-900">{item.title}</div>
                 <div className="text-xs text-gray-500 mt-1">{item.date}</div>
                 {item.inspector && <div className="text-xs text-gray-500">by {item.inspector}</div>}
                 {item.duration && <div className="text-xs text-gray-500">Duration: {item.duration}</div>}
               </div>
             ))}
          </div>
        </div>

        {/* Status Cards */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Inspection Status Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            
            <div className={`rounded-xl border-2 p-4 ${details.overallStatus === 'Passed' ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                <CheckCircle size={18} /> Passed
              </div>
              <p className="text-xs text-gray-600">Scooty returned in good condition.</p>
            </div>

            <div className={`rounded-xl border-2 p-4 ${details.overallStatus === 'Damage Found' ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-orange-600 font-bold mb-2">
                <AlertTriangle size={18} /> Damage Found
              </div>
              <p className="text-xs text-gray-600">Damage charges applied.</p>
            </div>

            <div className={`rounded-xl border-2 p-4 ${details.overallStatus === 'Needs Maintenance' ? 'border-gray-300 bg-gray-100' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
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
