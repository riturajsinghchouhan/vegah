import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import { Search, ChevronRight, CheckCircle, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminInspections() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, [searchTerm]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await adminService.getInspections({ search: searchTerm });
      setInspections(data || []);
    } catch (error) {
      console.error("Failed to load inspections", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <PageHeader 
        title="EV Inspections" 
        description="Manage pickup and return inspections for all bookings."
        actions={
          <button 
            onClick={fetchInspections}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />
      
      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by User Name, Booking ID or Inspection ID..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-sm text-white">
              <th className="px-6 py-4">Inspection ID</th>
              <th className="px-6 py-4">Booking</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Scooty</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  Loading inspections...
                </td>
              </tr>
            ) : inspections.map((inspection) => (
              <tr 
                key={inspection._id || inspection.inspectionId} 
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/inspections/${inspection.bookingId}`)}
              >
                <td className="px-6 py-4 font-semibold text-gray-900">{inspection.inspectionId}</td>
                <td className="px-6 py-4 text-blue-600 font-medium">{inspection.bookingId}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{inspection.user}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{inspection.scooty}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{inspection.date}</td>
                <td className="px-6 py-4">
                  {inspection.status === 'Passed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700"><CheckCircle size={14}/> Passed</span>}
                  {inspection.status === 'Damage Found' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700"><AlertTriangle size={14}/> Damage Found</span>}
                  {inspection.status === 'Needs Maintenance' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700"><Wrench size={14}/> Maintenance</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && inspections.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No inspections found matching "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
