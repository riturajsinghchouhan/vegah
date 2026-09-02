import React, { useState } from 'react';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { Plus, Eye, Edit3, Trash2, Search, Battery, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockScooties = [
  { id: 'EV-1001', plate: 'MH-12-AB-1234', model: 'Ather 450X', battery: 85, category: 'Premium', zone: 'Downtown Core', status: 'Available' },
  { id: 'EV-1002', plate: 'MH-12-AB-1235', model: 'Ola S1 Pro', battery: 42, category: 'Premium', zone: 'University Campus', status: 'Booked' },
  { id: 'EV-1003', plate: 'MH-12-AB-1236', model: 'Hero Optima', battery: 15, category: 'Standard', zone: 'Tech Park', status: 'Maintenance' },
  { id: 'EV-1004', plate: 'MH-12-AB-1237', model: 'Bajaj Chetak', battery: 0, category: 'Electric Scooty', zone: 'City Mall', status: 'Inactive' },
  { id: 'EV-1005', plate: 'MH-12-AB-1238', model: 'Ather 450X', battery: 98, category: 'Premium', zone: 'Downtown Core', status: 'Available' },
  { id: 'EV-1006', plate: 'MH-12-AB-1239', model: 'Hero Optima', battery: 100, category: 'Standard', zone: 'Tech Park', status: 'Available' },
];

const FILTERS = ['All', 'Available', 'Booked', 'Maintenance', 'Inactive'];

export default function AdminEVs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter the scooties based on search and active tab
  const filteredScooties = mockScooties.filter(scooty => {
    const matchesSearch = scooty.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          scooty.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || scooty.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate counts for the tabs
  const getCount = (status) => {
    if (status === 'All') return mockScooties.length;
    return mockScooties.filter(s => s.status === status).length;
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <PageHeader 
        title="All Scooties" 
        description="Manage your entire fleet of EVs from here."
        actions={
          <Button className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white border-none shadow-sm">
            <Plus size={16} /> Add Scooty
          </Button>
        }
      />
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        
        {/* Search Bar */}
        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder="Search by license plate or model..." 
            className="w-full bg-transparent border-none outline-none text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                activeFilter === filter 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              {filter} <span className="ml-1.5 opacity-60 text-xs">({getCount(filter)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of EV Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredScooties.map((scooty) => (
          <div key={scooty.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 pb-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{scooty.plate}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{scooty.model}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"><Eye size={16} strokeWidth={2.5} /></button>
                <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-green-600 transition-colors"><Edit3 size={16} strokeWidth={2.5} /></button>
                <button className="p-1.5 hover:bg-gray-100 rounded-md hover:text-red-600 transition-colors"><Trash2 size={16} strokeWidth={2.5} /></button>
              </div>
            </div>

            {/* Card Body - Details */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 text-sm gap-2">
                  <Tag size={16} /> Category
                </div>
                <span className="font-semibold text-gray-900 text-sm">{scooty.category}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 text-sm gap-2">
                  <MapPin size={16} /> Zone
                </div>
                <span className="font-semibold text-gray-900 text-sm">{scooty.zone}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 text-sm gap-2">
                  <Battery size={16} className={scooty.battery < 20 ? 'text-red-500' : 'text-green-500'} /> Battery
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", scooty.battery < 20 ? 'bg-red-500' : scooty.battery < 50 ? 'bg-yellow-500' : 'bg-green-500')} 
                      style={{ width: `${scooty.battery}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{scooty.battery}%</span>
                </div>
              </div>
            </div>

            {/* Card Footer (Status) */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">ID: {scooty.id}</span>
              <StatusBadge status={scooty.status} />
            </div>
            
          </div>
        ))}
        
        {filteredScooties.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No scooties found matching your current filters.
          </div>
        )}
      </div>

    </div>
  );
}
