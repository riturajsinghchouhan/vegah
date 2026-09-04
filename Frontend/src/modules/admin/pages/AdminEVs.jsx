import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { PlusIcon as Plus, EyeIcon as Eye, SquarePenIcon as Edit3, ArchiveIcon as Trash2, SearchIcon as Search, BatteryIcon as Battery, MapPinIcon as MapPin, BookmarkIcon as Tag } from 'lucide-animated';
import { cn } from '@/lib/utils';
import { adminService } from '../services/adminService';

const FILTERS = ['All', 'Available', 'Booked', 'Maintenance', 'Inactive'];

export default function AdminEVs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [scooties, setScooties] = useState([]);
  const [selectedScooty, setSelectedScooty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await adminService.getVehicles();
      
      // Map backend format to frontend format
      const mappedVehicles = (data || []).map(v => ({
        id: v._id,
        rawId: v._id,
        plate: v.plateNumber || 'Pending',
        model: v.model || v.name,
        brand: v.brand,
        battery: v.batteryPercent ?? 100,
        category: v.category?.name || 'Standard',
        zone: v.zone?.name || 'Unassigned',
        location: v.location || 'N/A',
        pricePerDay: v.pricePerDay || 0,
        pricePerHour: v.pricePerHour || 0,
        status: v.status ? (v.status.charAt(0).toUpperCase() + v.status.slice(1).toLowerCase()) : 'Available',
      }));
      
      setScooties(mappedVehicles);
    } catch (error) {
      console.error("Failed to load vehicles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this EV from fleet?")) return;
    try {
      await adminService.deleteVehicle(id);
      setScooties(prev => prev.filter(s => s.id !== id));
      if (selectedScooty?.id === id) setSelectedScooty(null);
    } catch (error) {
      console.error("Failed to delete vehicle", error);
      alert(error.response?.data?.message || "Failed to delete vehicle");
    }
  };

  // Filter the scooties based on search and active tab
  const filteredScooties = scooties.filter(scooty => {
    const matchesSearch = scooty.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          scooty.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || scooty.status.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Calculate counts for the tabs
  const getCount = (status) => {
    if (status === 'All') return scooties.length;
    return scooties.filter(s => s.status.toLowerCase() === status.toLowerCase()).length;
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <PageHeader 
        title="All Scooties" 
        description="Manage your entire fleet of EVs from here."
        actions={
          <Button 
            onClick={() => navigate('/admin/evs/new')}
            className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white border-none shadow-sm cursor-pointer"
          >
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
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading fleet...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredScooties.map((scooty) => (
          <div key={scooty.id} className="bg-indigo-50/30 rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 pb-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{scooty.plate}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{scooty.model}</p>
              </div>
              <div className="flex items-center gap-2 text-black">
                <button 
                  onClick={() => setSelectedScooty(scooty)}
                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                  title="View Vehicle"
                >
                  <Eye size={16} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => navigate(`/admin/evs/${scooty.id}`)}
                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                  title="Edit Vehicle"
                >
                  <Edit3 size={16} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => handleDeleteVehicle(scooty.id)}
                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                  title="Delete Vehicle"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
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
              <span className="text-xs text-gray-500 font-medium">ID: {scooty.id.substring(0, 8).toUpperCase()}</span>
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
      )}

      {/* Overview Modal */}
      <Modal
        isOpen={!!selectedScooty}
        onClose={() => setSelectedScooty(null)}
        title="Vehicle Details"
        size="md"
        accent={false}
      >
        {selectedScooty && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedScooty.plate}</h3>
                <p className="text-sm text-gray-500">{selectedScooty.model}</p>
              </div>
              <StatusBadge status={selectedScooty.status} />
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Vehicle ID</span>
                <span className="font-semibold text-gray-900">{selectedScooty.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Category</span>
                <span className="font-semibold text-gray-900">{selectedScooty.category}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Zone</span>
                <span className="font-semibold text-gray-900">{selectedScooty.zone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Location</span>
                <span className="font-semibold text-gray-900">{selectedScooty.location}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Daily Rate</span>
                <span className="font-semibold text-gray-900">₹{selectedScooty.pricePerDay}/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Hourly Rate</span>
                <span className="font-semibold text-gray-900">₹{selectedScooty.pricePerHour}/hr</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="primary" onClick={() => setSelectedScooty(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
