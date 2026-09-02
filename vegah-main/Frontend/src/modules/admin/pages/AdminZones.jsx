import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { MapPin, Map, Plus, Eye, Edit3, Trash2, Power, Search, Bike } from 'lucide-react';

const mockZones = [
  { id: 'Z-101', name: 'Kairana', subtitle: 'Kairana', unit: 'kilometer', status: 'Active', totalScooties: 6, availableScooties: 2 },
  { id: 'Z-102', name: 'Kandhla', subtitle: 'Kandhla', unit: 'kilometer', status: 'Active', totalScooties: 8, availableScooties: 4 },
  { id: 'Z-103', name: 'Sardhana', subtitle: 'Sardhana', unit: 'kilometer', status: 'Active', totalScooties: 21, availableScooties: 12 },
  { id: 'Z-104', name: 'Indore testing', subtitle: 'Indore testing', unit: 'kilometer', status: 'Active', totalScooties: 4, availableScooties: 1 },
  { id: 'Z-105', name: 'Lalitpur (Uttar Pradesh)', subtitle: 'Lalitpur (Uttar Pradesh)', unit: 'kilometer', status: 'Inactive', totalScooties: 6, availableScooties: 6 },
  { id: 'Z-106', name: 'Khatauli (Muzaffarnagar)', subtitle: 'Khatauli', unit: 'kilometer', status: 'Inactive', totalScooties: 6, availableScooties: 6 },
];

export default function AdminZones() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-red-500 text-white p-3 rounded-xl shadow-sm">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Zone Setup EV Rentals</h1>
            <p className="text-sm text-gray-500">Manage rental zones for EVs</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" className="bg-[#166534] hover:bg-[#14532d] border-none text-white shadow-sm gap-2">
            <Map size={16} /> View Map
          </Button>
          <Button 
            variant="primary" 
            className="bg-[#ea580c] hover:bg-[#c2410c] border-none text-white shadow-sm gap-2"
            onClick={() => navigate('/admin/zones/new')}
          >
            <Plus size={16} /> Add Zone
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search zones by name or location..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockZones.map((zone) => (
          <div key={zone.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{zone.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{zone.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <button className="hover:text-blue-600 transition-colors"><Eye size={18} strokeWidth={2.5} /></button>
                <button 
                  className="hover:text-green-600 transition-colors"
                  onClick={() => navigate(`/admin/zones/${zone.id}`)}
                >
                  <Edit3 size={18} strokeWidth={2.5} />
                </button>
                <button className="hover:text-red-600 transition-colors"><Trash2 size={18} strokeWidth={2.5} /></button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Unit:</span>
                <span className="font-semibold text-gray-900">{zone.unit}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={zone.status} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Scooties:</span>
                <span className="font-semibold text-gray-900">{zone.totalScooties}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Available:</span>
                <span className="font-semibold text-gray-900">{zone.availableScooties}</span>
              </div>
            </div>

            {/* Card Footer (Action) */}
            <div className="p-5 pt-0">
              {zone.status === 'Active' ? (
                <button className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg transition-colors">
                  <Power size={18} /> Deactivate Zone
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-medium py-2.5 rounded-lg transition-colors">
                  <Power size={18} /> Activate Zone
                </button>
              )}
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}
