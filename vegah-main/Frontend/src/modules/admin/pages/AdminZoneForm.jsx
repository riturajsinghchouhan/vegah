import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, MousePointerClick, Plus, Minus, Maximize, Layers } from 'lucide-react';

export default function AdminZoneForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = Boolean(id);
  const title = isEditing ? "Edit Zone" : "Add New Zone";
  
  // State for the form
  const [country, setCountry] = useState('India');
  const [zoneName, setZoneName] = useState('');
  const [unit, setUnit] = useState('Kilometers (km)');

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/admin/zones')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        <div className="bg-red-500 text-white p-2.5 rounded-xl shadow-sm">
          <MapPin size={22} />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-sm text-gray-500">Create a delivery zone for customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Panel: Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Zone Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Zone name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter zone name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Unit <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="Kilometers (km)">Kilometers (km)</option>
                <option value="Miles (mi)">Miles (mi)</option>
              </select>
            </div>
            
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-8">
              {isEditing ? 'Save Changes' : 'Create Zone'}
            </button>
          </div>
        </div>

        {/* Right Panel: Map */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col min-h-[500px]">
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Draw Zone on Map</h2>
            <button className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <MousePointerClick size={16} /> Start Drawing
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search location on map..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Map Placeholder Container */}
          <div className="flex-1 rounded-lg border border-gray-300 overflow-hidden relative bg-blue-50 flex items-center justify-center min-h-[400px]">
            {/* Fake map image background */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=India&zoom=4&size=800x600&sensor=false')] bg-cover bg-center"></div>
            
            {/* Mock Google Map Controls */}
            <div className="absolute top-4 right-4 flex bg-white rounded shadow-sm overflow-hidden text-sm font-medium">
              <button className="px-3 py-1.5 hover:bg-gray-100 border-r">Map</button>
              <button className="px-3 py-1.5 hover:bg-gray-100 text-gray-500">Satellite</button>
            </div>

            <div className="absolute top-14 right-4 bg-white p-2 rounded shadow-sm text-gray-600 cursor-pointer hover:bg-gray-50">
              <Maximize size={18} />
            </div>

            <div className="absolute bottom-16 right-4 flex flex-col bg-white rounded shadow-sm text-gray-600 overflow-hidden">
              <button className="p-2 hover:bg-gray-100 border-b cursor-pointer"><Plus size={18} /></button>
              <button className="p-2 hover:bg-gray-100 cursor-pointer"><Minus size={18} /></button>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-700 rounded shadow-sm font-medium">
              Google Maps Placeholder
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
