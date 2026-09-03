import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import { Search, ChevronRight, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';

const mockInspections = [
  {
    id: 'INSP-2041',
    bookingId: 'BK1025',
    user: 'Rahul Sharma',
    scooty: 'Ola S1 Pro (MP09AB1234)',
    date: '22 May 2025, 06:15 PM',
    status: 'Passed'
  },
  {
    id: 'INSP-2042',
    bookingId: 'BK1026',
    user: 'Priya Verma',
    scooty: 'Ather 450X (MP09AB5678)',
    date: '22 May 2025, 04:30 PM',
    status: 'Damage Found'
  },
  {
    id: 'INSP-2043',
    bookingId: 'BK1027',
    user: 'Amit Patel',
    scooty: 'Hero Optima (MP09AB9101)',
    date: '21 May 2025, 11:00 AM',
    status: 'Needs Maintenance'
  },
  {
    id: 'INSP-2044',
    bookingId: 'BK1028',
    user: 'Neha Singh',
    scooty: 'Bajaj Chetak (MP09AC1122)',
    date: '20 May 2025, 02:00 PM',
    status: 'Passed'
  }
];

export default function AdminInspections() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockInspections.filter(i => 
    i.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <PageHeader 
        title="EV Inspections" 
        description="Manage pickup and return inspections for all bookings."
      />
      
      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by User Name or Booking ID..." 
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
            {filtered.map((inspection) => (
              <tr 
                key={inspection.id} 
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/inspections/${inspection.bookingId}`)}
              >
                <td className="px-6 py-4 font-semibold text-gray-900">{inspection.id}</td>
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No inspections found for "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
